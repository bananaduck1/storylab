import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getSupabase } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

const OFFERING_CONFIG: Record<
  string,
  { unitAmount: number; productName: string; description: string; requiresSlot: boolean }
> = {
  consultation: {
    unitAmount: 50000, // $500.00
    productName: "StoryLab Parent Consultation",
    description: "1-hour strategy session",
    requiresSlot: true,
  },
  sprint: {
    unitAmount: 1000000, // $10,000.00
    productName: "StoryLab Common App Sprint",
    description: "Common App essay intensive with Sam Ahn",
    requiresSlot: false,
  },
};

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    offering_type,
    availability_id,
    teacher_id,
    parent_name,
    parent_email,
    student_grade,
    schools,
    essay_context,
    visitor_timezone,
    success_path,
    cancel_path,
  } = body;

  if (
    !offering_type ||
    !parent_name ||
    !parent_email ||
    !student_grade ||
    !schools ||
    !essay_context
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const config = OFFERING_CONFIG[offering_type as keyof typeof OFFERING_CONFIG];
  if (!config) {
    return NextResponse.json({ error: "Unknown offering type" }, { status: 400 });
  }

  if (config.requiresSlot && !availability_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabase();

  // ── Connect fee check ────────────────────────────────────────────────────
  // When teacher_id is set, look up their Connect account.
  // null stripe_account_id → fall through to direct checkout (Sam / no-connect teacher)
  // stripe_account_id set but onboarding_complete=false → 402 before touching the slot
  let connectAccountId: string | null = null;
  if (teacher_id) {
    const { data: teacherRow, error: teacherErr } = await supabase
      .from("teachers")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", teacher_id)
      .single();

    if (teacherErr || !teacherRow) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    if (teacherRow.stripe_account_id && !teacherRow.stripe_onboarding_complete) {
      return NextResponse.json(
        { error: "Teacher payment setup is incomplete" },
        { status: 402 }
      );
    }

    connectAccountId = teacherRow.stripe_account_id ?? null;
  }

  // For slot-based offerings: verify and reserve the slot
  if (config.requiresSlot && availability_id) {
    const { data: slot, error: slotError } = await supabase
      .from("availability")
      .select("id, datetime, is_booked")
      .eq("id", availability_id)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }
    if (slot.is_booked) {
      return NextResponse.json({ error: "Slot is no longer available" }, { status: 409 });
    }

    const { data: reserved, error: reserveError } = await supabase
      .from("availability")
      .update({ is_booked: true })
      .eq("id", availability_id)
      .eq("is_booked", false) // guard against race condition
      .select("id");

    if (reserveError) {
      return NextResponse.json({ error: "Failed to reserve slot" }, { status: 500 });
    }
    if (!reserved || reserved.length === 0) {
      // Another request won the race — slot was booked between our read and write
      return NextResponse.json({ error: "Slot is no longer available" }, { status: 409 });
    }
  }

  // Create pending booking record
  const insertData: Record<string, string> = {
    offering_type,
    parent_name,
    parent_email,
    student_grade,
    schools,
    essay_context,
    status: "pending",
  };
  if (availability_id) insertData.availability_id = availability_id;
  if (teacher_id) insertData.teacher_id = teacher_id;

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert(insertData)
    .select("id")
    .single();

  if (bookingError || !booking) {
    // Roll back slot reservation if applicable
    if (config.requiresSlot && availability_id) {
      await supabase.from("availability").update({ is_booked: false }).eq("id", availability_id);
    }
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }

  // Build origin for redirect URLs
  const origin =
    req.headers.get("origin") ?? req.headers.get("host")
      ? `https://${req.headers.get("host")}`
      : "https://ivystorylab.com";

  // Create Stripe Checkout session
  let session;
  try {
    // us_bank_account (ACH) is not supported with application_fee_amount on Connect sessions
    const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = connectAccountId
      ? ["card", "alipay", "link", "wechat_pay"]
      : ["card", "us_bank_account", "alipay", "link", "wechat_pay"];

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: paymentMethodTypes,
      payment_method_options: {
        wechat_pay: { client: "web" },
      },
      mode: "payment",
      customer_email: parent_email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: config.unitAmount,
            product_data: {
              name: config.productName,
              description: config.description,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        booking_id: booking.id,
        offering_type,
        visitor_timezone: visitor_timezone ?? "America/New_York",
      },
      success_url: success_path
        ? `${origin}${success_path}?booking_id=${booking.id}`
        : `${origin}/academy/pricing/${offering_type}/confirmed?booking_id=${booking.id}`,
      cancel_url: cancel_path
        ? `${origin}${cancel_path}?cancelled=1`
        : `${origin}/academy/pricing/${offering_type}?cancelled=1`,
    };

    // Inject Connect fee when routing to a teacher's account
    if (connectAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: Math.floor(config.unitAmount * 0.2),
        transfer_data: { destination: connectAccountId },
      };
    }

    session = await getStripe().checkout.sessions.create(sessionParams);
  } catch (err) {
    console.error("[checkout] Stripe session creation failed:", err);
    // Roll back booking and slot if needed
    await supabase.from("bookings").delete().eq("id", booking.id);
    if (config.requiresSlot && availability_id) {
      await supabase.from("availability").update({ is_booked: false }).eq("id", availability_id);
    }
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!session.url) {
    return NextResponse.json({ error: "No checkout URL returned from Stripe" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}

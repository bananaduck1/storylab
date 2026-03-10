import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

const OFFERING_CONFIG: Record<
  string,
  { unitAmount: number; productName: string; description: string; duration: string }
> = {
  consultation: {
    unitAmount: 50000, // $500.00
    productName: "StoryLab Parent Consultation",
    description: "1-hour strategy session with Sam Ahn",
    duration: "1 hour",
  },
  sprint: {
    unitAmount: 1000000, // $10,000.00
    productName: "StoryLab Common App Sprint",
    description: "Common App essay intensive with Sam Ahn",
    duration: "Full engagement",
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
    parent_name,
    parent_email,
    student_grade,
    schools,
    essay_context,
    visitor_timezone,
  } = body;

  if (
    !offering_type ||
    !availability_id ||
    !parent_name ||
    !parent_email ||
    !student_grade ||
    !schools ||
    !essay_context
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const config = OFFERING_CONFIG[offering_type];
  if (!config) {
    return NextResponse.json({ error: "Unknown offering type" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Verify slot is still available (service role bypasses RLS)
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

  // Reserve the slot immediately to prevent double-booking
  const { error: reserveError } = await supabase
    .from("availability")
    .update({ is_booked: true })
    .eq("id", availability_id)
    .eq("is_booked", false); // guard against race condition

  if (reserveError) {
    return NextResponse.json({ error: "Failed to reserve slot" }, { status: 500 });
  }

  // Create pending booking record
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      offering_type,
      availability_id,
      parent_name,
      parent_email,
      student_grade,
      schools,
      essay_context,
      status: "pending",
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    // Roll back slot reservation
    await supabase.from("availability").update({ is_booked: false }).eq("id", availability_id);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }

  // Build origin for redirect URLs
  const origin =
    req.headers.get("origin") ?? req.headers.get("host")
      ? `https://${req.headers.get("host")}`
      : "https://ivystorylab.com";

  // Create Stripe Checkout session
  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card", "us_bank_account", "alipay", "link", "wechat_pay"],
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
    success_url: `${origin}/academy/pricing/${offering_type}/confirmed?booking_id=${booking.id}`,
    cancel_url: `${origin}/academy/pricing/${offering_type}?cancelled=1`,
  });

  return NextResponse.json({ url: session.url });
}

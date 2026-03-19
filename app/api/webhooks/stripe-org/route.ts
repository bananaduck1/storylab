import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_ORG_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[webhook/stripe-org] Invalid signature:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = getSupabase();

  // Idempotency: check stripe_events table (id column IS the Stripe event ID)
  const { data: existing } = await db.from("stripe_events").select("id").eq("id", event.id).maybeSingle();
  if (existing) return NextResponse.json({ received: true }); // already processed

  const { error: insertError } = await db.from("stripe_events").insert({ id: event.id });
  if (insertError && (insertError as any).code !== "23505") {
    console.error("[webhook/stripe-org] Failed to record event:", insertError);
  }

  const sub = event.data?.object;

  if (["customer.subscription.created", "customer.subscription.updated"].includes(event.type)) {
    const status = sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "canceled";
    await db.from("org_subscriptions")
      .update({
        stripe_subscription_id: sub.id,
        status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_customer_id", sub.customer);
  } else if (event.type === "customer.subscription.deleted") {
    await db.from("org_subscriptions")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("stripe_customer_id", sub.customer);
  }

  return NextResponse.json({ received: true });
}

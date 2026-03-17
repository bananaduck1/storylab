import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

// ── Idempotency ───────────────────────────────────────────────────────────────

/**
 * Insert the event ID into stripe_events. Returns true if newly inserted
 * (first time we've seen this event), false if already processed.
 */
async function claimEvent(eventId: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from("stripe_events")
    .insert({ id: eventId });

  if (!error) return true;
  // Postgres unique-violation code = 23505
  if ((error as { code?: string }).code === "23505") return false;
  // Any other error — re-throw so it surfaces as a 500
  throw error;
}

// ── Event handlers ────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error("[lab/webhook] checkout.session.completed: no user_id in metadata");
    return;
  }

  if (session.mode === "payment") {
    // Top-up: credit +100 messages atomically
    await getSupabase().rpc("increment_extra_messages", {
      p_user_id: userId,
      p_amount: 100,
    });
  }
  // For subscriptions: customer.subscription.updated fires immediately after
  // and sets plan/status/period_end — no action needed here.
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const userId = sub.metadata?.user_id;
  if (!userId) {
    console.error("[lab/webhook] customer.subscription.updated: no user_id in metadata");
    return;
  }

  const isActive = sub.status === "active" || sub.status === "trialing";
  // In Stripe v20, current_period_end lives on SubscriptionItem, not Subscription
  const periodEndTs = sub.items?.data[0]?.current_period_end;
  const periodEnd = periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null;

  await getSupabase()
    .from("student_profiles")
    .update({
      plan: isActive ? "monthly" : "free",
      monthly_message_limit: isActive ? 500 : 50,
      stripe_subscription_id: sub.id,
      subscription_status: sub.status,
      current_period_end: periodEnd,
    })
    .eq("user_id", userId);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const userId = sub.metadata?.user_id;
  if (!userId) {
    console.error("[lab/webhook] customer.subscription.deleted: no user_id in metadata");
    return;
  }

  await getSupabase()
    .from("student_profiles")
    .update({
      plan: "free",
      monthly_message_limit: 50,
      subscription_status: "canceled",
      stripe_subscription_id: null,
      current_period_end: null,
    })
    .eq("user_id", userId);
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_LAB_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[lab/webhook] STRIPE_LAB_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    console.error("[lab/webhook] Signature error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Idempotency guard — safe to receive the same event twice
  let claimed: boolean;
  try {
    claimed = await claimEvent(event.id);
  } catch (err) {
    console.error("[lab/webhook] Failed to claim event:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  if (!claimed) {
    return NextResponse.json({ received: true, skipped: true });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    default:
      // Ignore unhandled event types
      break;
  }

  return NextResponse.json({ received: true });
}

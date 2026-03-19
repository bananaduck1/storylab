import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

// ── Idempotency ───────────────────────────────────────────────────────────────

async function claimEvent(eventId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("stripe_events")
    .insert({ id: eventId });

  if (!error) return;
  if ((error as { code?: string }).code === "23505") return; // already processed
  throw error;
}

// ── Event handlers ────────────────────────────────────────────────────────────

async function handleAccountUpdated(account: Stripe.Account) {
  // Mark onboarding complete when Stripe confirms the account can accept charges
  const onboardingComplete =
    account.charges_enabled === true && account.details_submitted === true;

  const { error } = await getSupabase()
    .from("teachers")
    .update({ stripe_onboarding_complete: onboardingComplete })
    .eq("stripe_account_id", account.id);

  if (error) {
    // Throw so this returns 500 — Stripe will retry delivery
    throw new Error(
      `[connect/webhook] DB update failed for account ${account.id}: ${error.message}`
    );
  }

  console.log(
    `[connect/webhook] account.updated: ${account.id} → onboarding_complete=${onboardingComplete}`
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[connect/webhook] STRIPE_CONNECT_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    console.error("[connect/webhook] Signature error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Best-effort idempotency — claimEvent swallows 23505 (already processed) and
  // throws only on unexpected DB errors. handleAccountUpdated is idempotent so a
  // duplicate delivery just sets the same value again. Claim after handler (like
  // the lab webhook) would be a stricter pattern if needed in future.
  try {
    await claimEvent(event.id);
  } catch (err) {
    console.warn("[connect/webhook] claimEvent failed (non-fatal):", err);
  }

  try {
    switch (event.type) {
      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      default:
        // Ignore unhandled event types
        break;
    }
  } catch (err) {
    console.error("[connect/webhook] Handler failed:", err);
    // Return 500 so Stripe retries delivery
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

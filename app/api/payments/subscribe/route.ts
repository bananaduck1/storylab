import { NextRequest, NextResponse } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import { getStripe, getOrCreateStripeCustomer } from "@/lib/stripe";

export async function POST(_req: NextRequest) {
  const user = await getCallerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const priceId = process.env.LAB_MONTHLY_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "Monthly plan not configured" }, { status: 500 });
  }

  const db = getSupabase();

  const { data: profile } = await db
    .from("student_profiles")
    .select("stripe_customer_id, full_name, plan, subscription_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Don't create a second subscription if already active
  if (profile.plan === "monthly" && profile.subscription_status === "active") {
    return NextResponse.json({ error: "Already subscribed" }, { status: 409 });
  }

  const customerId = await getOrCreateStripeCustomer(
    user.id,
    user.email,
    profile.full_name,
    profile.stripe_customer_id
  );

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://ivystorylab.com";

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/lab?success=subscription`,
    cancel_url: `${origin}/lab`,
    metadata: { user_id: user.id },
    subscription_data: { metadata: { user_id: user.id } },
  });

  return NextResponse.json({ url: session.url });
}

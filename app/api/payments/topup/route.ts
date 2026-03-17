import { NextRequest, NextResponse } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import { getStripe, getOrCreateStripeCustomer } from "@/lib/stripe";

export async function POST(_req: NextRequest) {
  const user = await getCallerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const priceId = process.env.LAB_TOPUP_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "Top-up not configured" }, { status: 500 });
  }

  const db = getSupabase();

  const { data: profile } = await db
    .from("student_profiles")
    .select("stripe_customer_id, full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
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
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/lab?success=topup`,
    cancel_url: `${origin}/lab`,
    metadata: { user_id: user.id },
  });

  return NextResponse.json({ url: session.url });
}

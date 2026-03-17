import { NextRequest, NextResponse } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const user = await getCallerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const priceId = process.env.LAB_TOPUP_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "Top-up not configured" }, { status: 500 });
  }

  const db = getSupabase();
  const stripe = getStripe();

  const { data: profile } = await db
    .from("student_profiles")
    .select("stripe_customer_id, full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Get or create Stripe customer
  let customerId: string = profile.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: profile.full_name,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await db
      .from("student_profiles")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", user.id);
  }

  const origin = req.headers.get("origin") ?? "https://ivystorylab.com";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/lab?success=topup`,
    cancel_url: `${origin}/lab`,
    metadata: { user_id: user.id },
  });

  return NextResponse.json({ url: session.url });
}

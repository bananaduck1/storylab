import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isOrgAdmin } from "@/lib/org-auth";
import { getStripe } from "@/lib/stripe";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { org_slug } = await request.json();
  if (!org_slug) return NextResponse.json({ error: "org_slug required" }, { status: 400 });

  const admin = await isOrgAdmin(user.id, org_slug);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getSupabase();
  const { data: orgSub } = await db
    .from("org_subscriptions")
    .select("stripe_customer_id, status, organizations!inner(slug, name)")
    .eq("organizations.slug", org_slug)
    .maybeSingle();

  if (!orgSub) return NextResponse.json({ error: "Org not found" }, { status: 404 });
  if ((orgSub as any).status === "active") return NextResponse.json({ error: "Already subscribed" }, { status: 400 });

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const stripe = getStripe();

  // Requires STRIPE_ORG_PRICE_ID env var — the price ID for the org subscription product
  const priceId = process.env.STRIPE_ORG_PRICE_ID;
  if (!priceId) return NextResponse.json({ error: "Org subscription not configured" }, { status: 500 });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: (orgSub as any).stripe_customer_id ?? undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${SITE_URL}/org/${org_slug}/admin?subscribed=true`,
    cancel_url: `${SITE_URL}/org/${org_slug}/admin`,
    metadata: { org_slug },
  });

  return NextResponse.json({ url: session.url });
}

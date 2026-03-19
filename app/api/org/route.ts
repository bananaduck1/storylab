import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import { ADMIN_EMAIL } from "@/lib/lab-auth";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  // Auth: Sam only
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, slug, email_domain, ai_context } = await request.json();
  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug required" }, { status: 400 });
  }

  const db = getSupabase();

  // Check slug uniqueness
  const { data: existing } = await db.from("organizations").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }

  // Create org row first
  const { data: org, error: orgError } = await db
    .from("organizations")
    .insert({ name, slug, email_domain: email_domain || null, ai_context: ai_context || null })
    .select()
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: "Failed to create org" }, { status: 500 });
  }

  // Create Stripe customer (rollback org on failure)
  try {
    const stripe = getStripe();
    const customer = await stripe.customers.create({ name, metadata: { org_id: org.id, org_slug: slug } });
    // Create org_subscriptions row
    await db.from("org_subscriptions").insert({ org_id: org.id, stripe_customer_id: customer.id, status: "inactive" });
  } catch (err) {
    // Rollback
    await db.from("organizations").delete().eq("id", org.id);
    console.error("[api/org] Stripe customer create failed, rolled back org:", err);
    return NextResponse.json({ error: "Failed to set up billing. Org not created." }, { status: 500 });
  }

  return NextResponse.json({ org });
}

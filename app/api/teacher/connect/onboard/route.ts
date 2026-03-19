import { NextRequest, NextResponse } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import { getStripe, getOrCreateConnectAccount } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const user = await getCallerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabase();

  const { data: teacher, error: teacherError } = await db
    .from("teachers")
    .select("id, email, stripe_account_id")
    .eq("user_id", user.id)
    .single();

  if (teacherError || !teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  let accountId: string;
  try {
    accountId = await getOrCreateConnectAccount(teacher.id, teacher.email);
  } catch (err) {
    console.error("[connect/onboard] Failed to create/retrieve Connect account:", err);
    const message = err instanceof Error ? err.message : "Failed to create Connect account";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://ivystorylab.com";

  let link;
  try {
    link = await getStripe().accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      return_url: `${origin}/dashboard/settings?tab=payments&connect=done`,
      refresh_url: `${origin}/dashboard/settings?tab=payments&connect=refresh`,
    });
  } catch (err) {
    console.error("[connect/onboard] Failed to create account link:", err);
    const message = err instanceof Error ? err.message : "Failed to create onboarding link";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ url: link.url });
}

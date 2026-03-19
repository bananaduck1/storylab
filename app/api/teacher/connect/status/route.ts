import { NextRequest, NextResponse } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const user = await getCallerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: teacher, error: teacherError } = await getSupabase()
    .from("teachers")
    .select("stripe_account_id, stripe_onboarding_complete")
    .eq("user_id", user.id)
    .single();

  if (teacherError || !teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  if (!teacher.stripe_account_id) {
    return NextResponse.json({
      onboarding_complete: false,
      available: null,
      pending: null,
    });
  }

  try {
    const balance = await getStripe().balance.retrieve({
      stripeAccount: teacher.stripe_account_id,
    });

    // Sum available and pending across all currencies (display USD first, fall back to first)
    const availableUsd =
      balance.available.find((b) => b.currency === "usd")?.amount ??
      balance.available[0]?.amount ??
      0;
    const pendingUsd =
      balance.pending.find((b) => b.currency === "usd")?.amount ??
      balance.pending[0]?.amount ??
      0;

    return NextResponse.json({
      onboarding_complete: teacher.stripe_onboarding_complete,
      available: availableUsd,
      pending: pendingUsd,
    });
  } catch (err) {
    // Account may be deauthorized — return safe zero state
    console.warn("[connect/status] Failed to retrieve balance:", err);
    return NextResponse.json({
      onboarding_complete: false,
      available: null,
      pending: null,
      deauthorized: true,
    });
  }
}

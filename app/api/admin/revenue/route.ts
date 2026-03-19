import { NextRequest, NextResponse } from "next/server";
import { getCallerUser, ADMIN_EMAIL } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

interface RevenueRow {
  teacher_id: string;
  teacher_name: string;
  stripe_account_id: string;
  platform_fee_cents: number;
  booking_count: number;
}

export async function GET(req: NextRequest) {
  const user = await getCallerUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch all teachers with a connected account
  const { data: teachers, error: teachersError } = await getSupabase()
    .from("teachers")
    .select("id, name, stripe_account_id")
    .not("stripe_account_id", "is", null);

  if (teachersError) {
    console.error("[admin/revenue] Failed to fetch teachers:", teachersError);
    return NextResponse.json({ error: "Failed to load teacher data" }, { status: 500 });
  }

  if (!teachers || teachers.length === 0) {
    return NextResponse.json({ rows: [] });
  }

  // Build a map of stripe_account_id → teacher for lookup
  const teacherByAccount = new Map<string, { id: string; name: string }>();
  for (const t of teachers) {
    if (t.stripe_account_id) {
      teacherByAccount.set(t.stripe_account_id, { id: t.id, name: t.name });
    }
  }

  // Fetch application fees from Stripe (up to 100 most recent)
  let fees: import("stripe").default.ApplicationFee[];
  try {
    const result = await getStripe().applicationFees.list({ limit: 100 });
    fees = result.data;
  } catch (err) {
    console.error("[admin/revenue] Stripe applicationFees.list failed:", err);
    return NextResponse.json({ error: "Failed to load revenue data" }, { status: 500 });
  }

  // Aggregate by connected account
  const aggregated = new Map<string, { fee_cents: number; count: number }>();
  for (const fee of fees) {
    const accountId =
      typeof fee.account === "string" ? fee.account : fee.account?.id;
    if (!accountId) continue;

    const existing = aggregated.get(accountId) ?? { fee_cents: 0, count: 0 };
    aggregated.set(accountId, {
      fee_cents: existing.fee_cents + fee.amount,
      count: existing.count + 1,
    });
  }

  // Build output rows, joining to teacher names
  const rows: RevenueRow[] = [];
  for (const [accountId, { fee_cents, count }] of aggregated.entries()) {
    const teacher = teacherByAccount.get(accountId);
    rows.push({
      teacher_id: teacher?.id ?? "unknown",
      teacher_name: teacher?.name ?? accountId,
      stripe_account_id: accountId,
      platform_fee_cents: fee_cents,
      booking_count: count,
    });
  }

  // Sort by highest platform fee first
  rows.sort((a, b) => b.platform_fee_cents - a.platform_fee_cents);

  return NextResponse.json({ rows });
}

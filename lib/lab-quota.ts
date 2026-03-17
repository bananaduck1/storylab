import { getSupabase } from "@/lib/supabase";

export type DebitType = "extra" | "daily" | "monthly";

// Read at call-time so tests can set process.env.LAB_DAILY_LIMIT in beforeEach
// and so a config change takes effect on the next deploy without needing a code change.
function freeDailyLimit(): number {
  return parseInt(process.env.LAB_DAILY_LIMIT ?? "50");
}

export interface QuotaState {
  plan: "free" | "monthly";
  /** Total messages the user can still send right now */
  remaining: number;
  /** Ceiling shown in the UI */
  limit: number;
  extraMessages: number;
  debitType: DebitType;
}

/**
 * Check how many messages the user has left and what should be debited next.
 * Always called with service-role Supabase — never trusts client input.
 */
export async function checkQuota(userId: string): Promise<QuotaState | null> {
  const db = getSupabase();
  const today = new Date().toISOString().split("T")[0];

  const { data: profile } = await db
    .from("student_profiles")
    .select("plan, monthly_message_limit, extra_messages, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) return null;

  const plan = (profile.plan ?? "free") as "free" | "monthly";
  const extraMessages = profile.extra_messages ?? 0;

  if (plan === "monthly") {
    // Count usage within the current billing period
    let periodStart: string;
    if (profile.current_period_end) {
      const periodEnd = new Date(profile.current_period_end);
      const ps = new Date(periodEnd);
      ps.setMonth(ps.getMonth() - 1);
      periodStart = ps.toISOString().split("T")[0];
    } else {
      // Fallback: current calendar month
      const now = new Date();
      periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    }

    const { count } = await db
      .from("usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("day", periodStart);

    const used = count ?? 0;
    const limit = profile.monthly_message_limit ?? 500;
    const remaining = Math.max(0, limit - used);

    return { plan, remaining, limit, extraMessages, debitType: "monthly" };
  }

  // Free plan — drain extra_messages first, then daily cap
  const { count: dailyCount } = await db
    .from("usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("day", today);

  const dailyUsed = dailyCount ?? 0;
  const dailyRemaining = Math.max(0, freeDailyLimit() - dailyUsed);

  if (extraMessages > 0) {
    // Extra messages drain first; daily cap is the backstop
    return {
      plan,
      remaining: extraMessages + dailyRemaining,
      limit: extraMessages + freeDailyLimit(),
      extraMessages,
      debitType: "extra",
    };
  }

  return {
    plan,
    remaining: dailyRemaining,
    limit: freeDailyLimit(),
    extraMessages: 0,
    debitType: "daily",
  };
}

/**
 * Debit one message from the appropriate quota bucket.
 * Called inside after() so the response has already been sent.
 */
export async function debitQuota(
  userId: string,
  debitType: DebitType,
  conversationId: string,
  today: string
): Promise<void> {
  const db = getSupabase();

  if (debitType === "extra") {
    await db.rpc("decrement_extra_messages", { p_user_id: userId });
  } else {
    // "daily" or "monthly" — both tracked via usage_logs
    await db.from("usage_logs").insert({
      user_id: userId,
      conversation_id: conversationId,
      day: today,
    });
  }
}

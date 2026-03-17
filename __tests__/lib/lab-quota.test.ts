import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase", () => ({ getSupabase: vi.fn() }));

import { checkQuota, debitQuota } from "@/lib/lab-quota";
import { getSupabase } from "@/lib/supabase";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDbChain(result: unknown) {
  const p = Promise.resolve(result);
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ error: null }),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (r: (v: unknown) => unknown) => p.then(r),
    catch: (r: (v: unknown) => unknown) => p.catch(r),
  };
}

function mockDb(profileData: object | null, usageCount: number) {
  vi.mocked(getSupabase).mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === "student_profiles") {
        return makeDbChain(profileData ? { data: profileData, error: null } : { data: null, error: null });
      }
      if (table === "usage_logs") {
        return makeDbChain({ count: usageCount, data: null });
      }
      return makeDbChain({ data: null, error: null });
    }),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  } as never);
}

// ── checkQuota — free plan ────────────────────────────────────────────────────

describe("checkQuota — free plan", () => {
  beforeEach(() => {
    process.env.LAB_DAILY_LIMIT = "50";
  });

  it("[C] returns daily debitType when extras=0 and under limit", async () => {
    mockDb({ plan: "free", monthly_message_limit: 50, extra_messages: 0, current_period_end: null }, 10);
    const q = await checkQuota("user-1");
    expect(q).not.toBeNull();
    expect(q!.plan).toBe("free");
    expect(q!.debitType).toBe("daily");
    expect(q!.remaining).toBe(40);
    expect(q!.limit).toBe(50);
  });

  it("[D] returns remaining=0 when daily limit is reached", async () => {
    mockDb({ plan: "free", monthly_message_limit: 50, extra_messages: 0, current_period_end: null }, 50);
    const q = await checkQuota("user-1");
    expect(q!.remaining).toBe(0);
  });

  it("[D] remaining never goes below 0 if usage exceeds limit", async () => {
    mockDb({ plan: "free", monthly_message_limit: 50, extra_messages: 0, current_period_end: null }, 99);
    const q = await checkQuota("user-1");
    expect(q!.remaining).toBe(0);
  });

  it("[B] returns extra debitType and combined remaining when extras>0", async () => {
    // extras=20, daily used=10 → remaining = 20 + (50-10) = 60
    mockDb({ plan: "free", monthly_message_limit: 50, extra_messages: 20, current_period_end: null }, 10);
    const q = await checkQuota("user-1");
    expect(q!.debitType).toBe("extra");
    expect(q!.remaining).toBe(60);
    expect(q!.extraMessages).toBe(20);
  });

  it("[B] extras drain first even when daily limit not reached", async () => {
    mockDb({ plan: "free", monthly_message_limit: 50, extra_messages: 5, current_period_end: null }, 0);
    const q = await checkQuota("user-1");
    expect(q!.debitType).toBe("extra");
  });

  it("[E] returns null when profile does not exist", async () => {
    mockDb(null, 0);
    const q = await checkQuota("ghost-user");
    expect(q).toBeNull();
  });
});

// ── checkQuota — monthly plan ─────────────────────────────────────────────────

describe("checkQuota — monthly plan", () => {
  it("[A] counts usage within billing period for active monthly plan", async () => {
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 15); // 15 days from now
    mockDb(
      { plan: "monthly", monthly_message_limit: 500, extra_messages: 0, current_period_end: periodEnd.toISOString() },
      120
    );
    const q = await checkQuota("user-monthly");
    expect(q!.plan).toBe("monthly");
    expect(q!.debitType).toBe("monthly");
    expect(q!.remaining).toBe(380);
    expect(q!.limit).toBe(500);
  });

  it("[A] returns remaining=0 when monthly limit is exhausted", async () => {
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 5);
    mockDb(
      { plan: "monthly", monthly_message_limit: 500, extra_messages: 0, current_period_end: periodEnd.toISOString() },
      500
    );
    const q = await checkQuota("user-monthly");
    expect(q!.remaining).toBe(0);
  });

  it("[F] falls back to calendar month when current_period_end is null", async () => {
    mockDb({ plan: "monthly", monthly_message_limit: 500, extra_messages: 0, current_period_end: null }, 50);
    const q = await checkQuota("user-monthly");
    expect(q!.plan).toBe("monthly");
    expect(q!.remaining).toBe(450);
  });
});

// ── checkQuota — preloaded profile ────────────────────────────────────────────

describe("checkQuota — preloaded profile", () => {
  beforeEach(() => {
    process.env.LAB_DAILY_LIMIT = "50";
  });

  it("skips student_profiles SELECT when preloadedProfile is provided", async () => {
    const fromMock = vi.fn((table: string) => {
      // Only usage_logs is expected; student_profiles SELECT would be a test failure
      expect(table).not.toBe("student_profiles");
      return makeDbChain({ count: 5, data: null });
    });
    vi.mocked(getSupabase).mockReturnValue({ from: fromMock } as never);

    const profile = { plan: "free", extra_messages: 0, monthly_message_limit: null, current_period_end: null };
    const q = await checkQuota("user-1", profile);
    expect(q).not.toBeNull();
    expect(q!.remaining).toBe(45);
  });

  it("returns null immediately when preloadedProfile is null", async () => {
    const fromMock = vi.fn();
    vi.mocked(getSupabase).mockReturnValue({ from: fromMock } as never);

    const q = await checkQuota("user-1", null);
    expect(q).toBeNull();
    // No DB calls should be made
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("uses preloaded profile values correctly for monthly plan", async () => {
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 10);
    const fromMock = vi.fn((table: string) => {
      expect(table).toBe("usage_logs");
      return makeDbChain({ count: 100, data: null });
    });
    vi.mocked(getSupabase).mockReturnValue({ from: fromMock } as never);

    const profile = {
      plan: "monthly",
      monthly_message_limit: 500,
      extra_messages: 0,
      current_period_end: periodEnd.toISOString(),
    };
    const q = await checkQuota("user-1", profile);
    expect(q!.plan).toBe("monthly");
    expect(q!.remaining).toBe(400);
  });
});

// ── debitQuota ────────────────────────────────────────────────────────────────

describe("debitQuota", () => {
  it("[G] calls decrement_extra_messages RPC when debitType=extra", async () => {
    const mockRpc = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(getSupabase).mockReturnValue({ rpc: mockRpc } as never);

    await debitQuota("user-1", "extra", "conv-1", "2026-03-17");

    expect(mockRpc).toHaveBeenCalledWith("decrement_extra_messages", { p_user_id: "user-1" });
  });

  it("[H] inserts usage_log when debitType=daily", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn(() => ({ insert: mockInsert })),
    } as never);

    await debitQuota("user-1", "daily", "conv-1", "2026-03-17");

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-1",
      conversation_id: "conv-1",
      day: "2026-03-17",
    });
  });

  it("[H] inserts usage_log when debitType=monthly", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn(() => ({ insert: mockInsert })),
    } as never);

    await debitQuota("user-1", "monthly", "conv-1", "2026-03-17");

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-1",
      conversation_id: "conv-1",
      day: "2026-03-17",
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/lab-auth", () => ({ getCallerUser: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getSupabase: vi.fn() }));
vi.mock("@/lib/lab-profile", () => ({ buildSystemPromptForUser: vi.fn().mockResolvedValue("mock prompt") }));
vi.mock("@/lib/knowledge-retrieval", () => ({ retrieveKnowledge: vi.fn().mockResolvedValue([]) }));
// after() is a no-op in tests
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: vi.fn() };
});

import { POST } from "@/app/api/lab/chat/route";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";

const MOCK_USER = { id: "user-123", email: "test@test.com" };

// A free-plan profile with no extras — lets checkQuota() fall through to the
// daily limit check rather than returning null (which also triggers 429).
const FREE_PLAN_PROFILE = {
  data: {
    plan: "free",
    monthly_message_limit: 50,
    extra_messages: 0,
    current_period_end: null,
  },
  error: null,
};

function makeChain(result: unknown) {
  const p = Promise.resolve(result);
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
    update: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    then: (r: (v: unknown) => unknown) => p.then(r),
    catch: (r: (v: unknown) => unknown) => p.catch(r),
  };
  return chain;
}

function makeRequest(body: object) {
  return new Request("http://localhost/api/lab/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

describe("POST /api/lab/chat — rate limit enforcement", () => {
  beforeEach(() => {
    vi.mocked(getCallerUser).mockResolvedValue(MOCK_USER as never);
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.LAB_DAILY_LIMIT = "50";
  });

  it("returns 429 with daily_limit_reached when free plan usage is at limit", async () => {
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "student_profiles") return makeChain(FREE_PLAN_PROFILE);
        // usage_logs count = 50 → daily limit hit
        if (table === "usage_logs") return makeChain({ count: 50, data: null });
        return makeChain({ data: null, error: null });
      }),
    } as never);

    const res = await POST(makeRequest({
      conversation_id: "conv-456",
      message: "Hello",
    }));

    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toBe("daily_limit_reached");
  });

  it("returns X-RateLimit-Remaining: 0 header on 429", async () => {
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "student_profiles") return makeChain(FREE_PLAN_PROFILE);
        if (table === "usage_logs") return makeChain({ count: 50, data: null });
        return makeChain({ data: null, error: null });
      }),
    } as never);

    const res = await POST(makeRequest({
      conversation_id: "conv-456",
      message: "Hello",
    }));

    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(getCallerUser).mockResolvedValue(null);
    const res = await POST(makeRequest({ conversation_id: "conv-456", message: "Hello" }));
    expect(res.status).toBe(401);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/lab-auth", () => ({ getCallerUser: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getSupabase: vi.fn() }));
vi.mock("@/lib/lab-profile", () => ({ buildSystemPromptForUser: vi.fn().mockResolvedValue("mock prompt") }));
vi.mock("@/lib/knowledge-retrieval", () => ({ retrieveKnowledge: vi.fn().mockResolvedValue([]) }));
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: vi.fn() };
});

import { POST } from "@/app/api/lab/chat/route";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";

const MOCK_USER = { id: "user-123", email: "test@test.com" };

// Free plan profile with quota available so checkQuota passes and we reach
// the conversation ownership check.
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
  return {
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
}

function makeRequest(body: object) {
  return new Request("http://localhost/api/lab/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

describe("POST /api/lab/chat — conversation ownership validation", () => {
  beforeEach(() => {
    vi.mocked(getCallerUser).mockResolvedValue(MOCK_USER as never);
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.LAB_DAILY_LIMIT = "50";
  });

  it("returns 404 when conversation does not belong to the user", async () => {
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "student_profiles") return makeChain(FREE_PLAN_PROFILE);
        // usage_logs count = 0 → quota passes
        if (table === "usage_logs") return makeChain({ count: 0, data: null });
        // conversations check returns null — not found or wrong owner
        if (table === "conversations") return makeChain({ data: null, error: null });
        return makeChain({ data: null, error: null });
      }),
    } as never);

    const res = await POST(makeRequest({
      conversation_id: "conv-belongs-to-other-user",
      message: "Hello",
    }));

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Conversation not found");
  });

  it("returns 400 when message is empty", async () => {
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn(() => makeChain({ data: null, error: null })),
    } as never);

    const res = await POST(makeRequest({
      conversation_id: "conv-456",
      message: "   ",
    }));

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("message is required");
  });
});

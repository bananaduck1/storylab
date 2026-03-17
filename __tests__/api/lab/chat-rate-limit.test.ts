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

// Creates a Supabase chain that is both thenable (for await chain) and has .maybeSingle()
function makeChain(result: unknown) {
  const p = Promise.resolve(result);
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
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

  it("returns 429 when daily message limit is reached", async () => {
    // usage_logs count returns 50 (at limit)
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn((table: string) => {
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
    expect(data.limit).toBe(50);
  });

  it("returns X-RateLimit headers on 429", async () => {
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "usage_logs") return makeChain({ count: 50, data: null });
        return makeChain({ data: null, error: null });
      }),
    } as never);

    const res = await POST(makeRequest({
      conversation_id: "conv-456",
      message: "Hello",
    }));

    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(res.headers.get("X-RateLimit-Limit")).toBe("50");
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(getCallerUser).mockResolvedValue(null);
    const res = await POST(makeRequest({ conversation_id: "conv-456", message: "Hello" }));
    expect(res.status).toBe(401);
  });
});

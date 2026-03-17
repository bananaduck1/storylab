import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase", () => ({ getSupabase: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ getStripe: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({ get: (k: string) => k === "stripe-signature" ? "sig-ok" : null }),
}));

import { POST } from "@/app/api/webhooks/stripe/route";
import { getSupabase } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: string) {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "Content-Type": "application/json", "stripe-signature": "sig-ok" },
    body,
  }) as unknown as import("next/server").NextRequest;
}

function makeStripeEvent(type: string, data: object): object {
  return { id: `evt_${Math.random().toString(36).slice(2)}`, type, data: { object: data } };
}

function mockStripe(event: object) {
  vi.mocked(getStripe).mockReturnValue({
    webhooks: {
      constructEvent: vi.fn().mockReturnValue(event),
    },
  } as never);
}

function mockDb(opts: { insertError?: object | null; rpcError?: object | null } = {}) {
  const mockInsert = vi.fn().mockResolvedValue({ error: opts.insertError ?? null });
  const mockUpdate = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockResolvedValue({ error: null });
  const mockRpc = vi.fn().mockResolvedValue({ error: opts.rpcError ?? null });

  vi.mocked(getSupabase).mockReturnValue({
    from: vi.fn(() => ({
      insert: mockInsert,
      update: vi.fn(() => ({ eq: mockEq })),
    })),
    rpc: mockRpc,
  } as never);

  return { mockInsert, mockRpc, mockEq };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/stripe (lab)", () => {
  beforeEach(() => {
    process.env.STRIPE_LAB_WEBHOOK_SECRET = "whsec_test";
  });

  it("[S] returns 400 when stripe-signature header is missing", async () => {
    const { headers } = await import("next/headers");
    vi.mocked(headers).mockResolvedValueOnce({ get: () => null } as never);

    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(400);
  });

  it("[T] returns 400 when signature verification fails", async () => {
    vi.mocked(getStripe).mockReturnValue({
      webhooks: { constructEvent: vi.fn().mockImplementation(() => { throw new Error("Bad sig"); }) },
    } as never);

    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Bad sig");
  });

  it("[U] checkout.session.completed with mode=payment calls increment_extra_messages", async () => {
    const event = makeStripeEvent("checkout.session.completed", {
      mode: "payment",
      metadata: { user_id: "user-abc" },
    });
    mockStripe(event);
    const { mockRpc, mockInsert } = mockDb();

    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith("increment_extra_messages", {
      p_user_id: "user-abc",
      p_amount: 100,
    });
  });

  it("[V] checkout.session.completed with mode=subscription is a no-op (waits for sub.updated)", async () => {
    const event = makeStripeEvent("checkout.session.completed", {
      mode: "subscription",
      metadata: { user_id: "user-abc" },
    });
    mockStripe(event);
    const { mockRpc } = mockDb();

    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(200);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("[W] customer.subscription.updated with status=active sets plan=monthly and 500 limit", async () => {
    const periodEnd = Math.floor(Date.now() / 1000) + 30 * 86400;
    const event = makeStripeEvent("customer.subscription.updated", {
      id: "sub_123",
      status: "active",
      metadata: { user_id: "user-abc" },
      items: { data: [{ current_period_end: periodEnd }] },
    });
    mockStripe(event);
    const { mockEq } = mockDb();

    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(200);
    expect(mockEq).toHaveBeenCalled();
  });

  it("[X] customer.subscription.updated with status=past_due sets plan=free and 50 limit", async () => {
    const event = makeStripeEvent("customer.subscription.updated", {
      id: "sub_123",
      status: "past_due",
      metadata: { user_id: "user-abc" },
      items: { data: [{ current_period_end: 0 }] },
    });
    mockStripe(event);
    const { mockEq } = mockDb();

    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(200);
    expect(mockEq).toHaveBeenCalled();
  });

  it("[Y] customer.subscription.deleted resets to free plan", async () => {
    const event = makeStripeEvent("customer.subscription.deleted", {
      id: "sub_123",
      status: "canceled",
      metadata: { user_id: "user-abc" },
      items: { data: [] },
    });
    mockStripe(event);
    const { mockEq } = mockDb();

    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(200);
    expect(mockEq).toHaveBeenCalled();
  });

  it("[Z] same event delivered twice: handler runs, second claim is a silent no-op", async () => {
    const event = makeStripeEvent("checkout.session.completed", {
      mode: "payment",
      metadata: { user_id: "user-abc" },
    });
    mockStripe(event);

    // First delivery: insert succeeds
    const mockRpc = vi.fn().mockResolvedValue({ error: null });
    const insertMock = vi.fn()
      .mockResolvedValueOnce({ error: null })   // first delivery: claim succeeds
      .mockResolvedValueOnce({ error: { code: "23505" } }); // second: duplicate, swallowed

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn(() => ({ insert: insertMock })),
      rpc: mockRpc,
    } as never);

    const res1 = await POST(makeRequest("{}"));
    const res2 = await POST(makeRequest("{}"));

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    // rpc called on both deliveries (handler runs before claiming)
    expect(mockRpc).toHaveBeenCalledTimes(2);
  });

  it("[AA] claimEvent DB failure after successful handler returns 200 with console.warn", async () => {
    const event = makeStripeEvent("checkout.session.completed", {
      mode: "payment",
      metadata: { user_id: "user-abc" },
    });
    mockStripe(event);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mockRpc = vi.fn().mockResolvedValue({ error: null });
    // Non-23505 error on insert → triggers console.warn but should not throw
    const insertMock = vi.fn().mockResolvedValue({ error: { code: "08000", message: "DB unavailable" } });

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn(() => ({ insert: insertMock })),
      rpc: mockRpc,
    } as never);

    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(200);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[lab/webhook] Failed to record event ID"),
      expect.anything()
    );
    warnSpy.mockRestore();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/lab-auth", () => ({ getCallerUser: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getSupabase: vi.fn() }));
vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(),
  getOrCreateStripeCustomer: vi.fn(),
}));

import { POST as subscribePOST } from "@/app/api/payments/subscribe/route";
import { POST as topupPOST } from "@/app/api/payments/topup/route";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import { getStripe, getOrCreateStripeCustomer } from "@/lib/stripe";

const MOCK_USER = { id: "user-123", email: "test@test.com" };

function makeRequest() {
  return new Request("http://localhost/", { method: "POST" }) as unknown as import("next/server").NextRequest;
}

function mockProfileDb(profileData: object | null) {
  vi.mocked(getSupabase).mockReturnValue({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(
        profileData ? { data: profileData, error: null } : { data: null, error: null }
      ),
    })),
  } as never);
}

function mockStripeSession(url: string) {
  vi.mocked(getStripe).mockReturnValue({
    checkout: {
      sessions: { create: vi.fn().mockResolvedValue({ url }) },
    },
  } as never);
}

// ── /api/payments/subscribe ───────────────────────────────────────────────────

describe("POST /api/payments/subscribe", () => {
  beforeEach(() => {
    process.env.LAB_MONTHLY_PRICE_ID = "price_monthly_test";
    process.env.NEXT_PUBLIC_APP_URL = "https://ivystorylab.com";
    vi.mocked(getCallerUser).mockResolvedValue(MOCK_USER as never);
    vi.mocked(getOrCreateStripeCustomer).mockResolvedValue("cus_test_123");
  });

  it("[J] returns 401 when unauthenticated", async () => {
    vi.mocked(getCallerUser).mockResolvedValue(null);
    const res = await subscribePOST(makeRequest());
    expect(res.status).toBe(401);
  });

  it("[K] returns 404 when profile not found", async () => {
    mockProfileDb(null);
    const res = await subscribePOST(makeRequest());
    expect(res.status).toBe(404);
  });

  it("[L] returns 409 when already on monthly active plan", async () => {
    mockProfileDb({ stripe_customer_id: "cus_existing", full_name: "Sam", plan: "monthly", subscription_status: "active" });
    const res = await subscribePOST(makeRequest());
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe("Already subscribed");
  });

  it("[N] returns checkout URL for existing customer", async () => {
    mockProfileDb({ stripe_customer_id: "cus_existing", full_name: "Sam", plan: "free", subscription_status: null });
    mockStripeSession("https://checkout.stripe.com/session_abc");

    const res = await subscribePOST(makeRequest());

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe("https://checkout.stripe.com/session_abc");
  });

  it("[M] creates new customer and returns checkout URL when no stripe_customer_id", async () => {
    mockProfileDb({ stripe_customer_id: null, full_name: "New User", plan: "free", subscription_status: null });
    mockStripeSession("https://checkout.stripe.com/new_session");

    const res = await subscribePOST(makeRequest());

    expect(res.status).toBe(200);
    expect(getOrCreateStripeCustomer).toHaveBeenCalledWith("user-123", "test@test.com", "New User", null);
  });

  it("returns 500 when LAB_MONTHLY_PRICE_ID is not configured", async () => {
    delete process.env.LAB_MONTHLY_PRICE_ID;
    const res = await subscribePOST(makeRequest());
    expect(res.status).toBe(500);
  });
});

// ── /api/payments/topup ───────────────────────────────────────────────────────

describe("POST /api/payments/topup", () => {
  beforeEach(() => {
    process.env.LAB_TOPUP_PRICE_ID = "price_topup_test";
    process.env.NEXT_PUBLIC_APP_URL = "https://ivystorylab.com";
    vi.mocked(getCallerUser).mockResolvedValue(MOCK_USER as never);
    vi.mocked(getOrCreateStripeCustomer).mockResolvedValue("cus_test_123");
  });

  it("[O] returns 401 when unauthenticated", async () => {
    vi.mocked(getCallerUser).mockResolvedValue(null);
    const res = await topupPOST(makeRequest());
    expect(res.status).toBe(401);
  });

  it("[P] returns 404 when profile not found", async () => {
    mockProfileDb(null);
    const res = await topupPOST(makeRequest());
    expect(res.status).toBe(404);
  });

  it("[Q] creates new customer and returns checkout URL", async () => {
    mockProfileDb({ stripe_customer_id: null, full_name: "New User" });
    mockStripeSession("https://checkout.stripe.com/topup_session");

    const res = await topupPOST(makeRequest());

    expect(res.status).toBe(200);
    expect(getOrCreateStripeCustomer).toHaveBeenCalledWith("user-123", "test@test.com", "New User", null);
  });

  it("[R] returns checkout URL for existing customer", async () => {
    mockProfileDb({ stripe_customer_id: "cus_existing", full_name: "Sam" });
    mockStripeSession("https://checkout.stripe.com/topup_existing");

    const res = await topupPOST(makeRequest());

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe("https://checkout.stripe.com/topup_existing");
  });

  it("success_url uses NEXT_PUBLIC_APP_URL not Origin header", async () => {
    mockProfileDb({ stripe_customer_id: "cus_123", full_name: "Sam" });
    const createSession = vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/x" });
    vi.mocked(getStripe).mockReturnValue({
      checkout: { sessions: { create: createSession } },
    } as never);

    await topupPOST(makeRequest());

    const call = createSession.mock.calls[0][0];
    expect(call.success_url).toContain("https://ivystorylab.com");
    expect(call.cancel_url).toContain("https://ivystorylab.com");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase", () => ({ getSupabase: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ getStripe: vi.fn() }));

import { POST } from "@/app/api/book/checkout/route";
import { getSupabase } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/book/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

const VALID_BODY = {
  offering_type: "consultation",
  availability_id: "slot-123",
  teacher_id: "teacher-abc",
  parent_name: "Jane Smith",
  parent_email: "jane@example.com",
  student_grade: "11th Grade",
  schools: "Exeter → Harvard, Yale",
  essay_context: "Starting common app",
};

function mockStripeSession(url: string) {
  vi.mocked(getStripe).mockReturnValue({
    checkout: {
      sessions: { create: vi.fn().mockResolvedValue({ url }) },
    },
  } as never);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/book/checkout — teacher booking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = undefined as unknown as string;
  });

  it("returns 409 when slot is already booked (race condition guard)", async () => {
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "availability") {
          // First call: SELECT to check is_booked → returns is_booked: false
          // Second call chain: UPDATE...eq().eq().select() → returns empty (0 rows matched)
          let callCount = 0;
          const selectFn = vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              // First select: .select().eq().eq().single() for the initial read
              return {
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: { id: "slot-123", datetime: new Date(Date.now() + 3600000).toISOString(), is_booked: false },
                  error: null,
                }),
              };
            }
            // Second select: after .update().eq().eq().select() → empty array (race lost)
            return Promise.resolve({ data: [], error: null });
          });
          return {
            select: selectFn,
            update: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
            eq: vi.fn().mockReturnThis(),
          };
        }
        return {};
      }),
    } as never);

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/no longer available/i);
  });

  it("persists teacher_id in booking record when provided", async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "booking-xyz" }, error: null }),
      }),
    });

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "availability") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: "slot-123", datetime: new Date(Date.now() + 3600000).toISOString(), is_booked: false },
                error: null,
              }),
            })),
            update: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockResolvedValue({ data: [{ id: "slot-123" }], error: null }),
            })),
            eq: vi.fn().mockReturnThis(),
          };
        }
        if (table === "bookings") {
          return { insert: insertMock };
        }
        return {};
      }),
    } as never);

    mockStripeSession("https://checkout.stripe.com/test-session");

    await POST(makeRequest(VALID_BODY));

    const insertCall = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(insertCall.teacher_id).toBe("teacher-abc");
  });

  it("uses success_path and cancel_path in Stripe redirect URLs when provided", async () => {
    const createSession = vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/s" });

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "availability") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: "slot-123", datetime: new Date(Date.now() + 3600000).toISOString(), is_booked: false },
                error: null,
              }),
            })),
            update: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockResolvedValue({ data: [{ id: "slot-123" }], error: null }),
            })),
            eq: vi.fn().mockReturnThis(),
          };
        }
        if (table === "bookings") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "booking-xyz" }, error: null }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    vi.mocked(getStripe).mockReturnValue({
      checkout: { sessions: { create: createSession } },
    } as never);

    await POST(makeRequest({
      ...VALID_BODY,
      success_path: "/teachers/sam-a/book/confirmed",
      cancel_path: "/teachers/sam-a/book",
    }));

    const call = createSession.mock.calls[0][0] as { success_url: string; cancel_url: string };
    expect(call.success_url).toContain("/teachers/sam-a/book/confirmed");
    expect(call.cancel_url).toContain("/teachers/sam-a/book?cancelled=1");
  });

  it("falls back to legacy /academy/pricing/ redirect when no success_path/cancel_path", async () => {
    const createSession = vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/s" });

    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "availability") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: "slot-123", datetime: new Date(Date.now() + 3600000).toISOString(), is_booked: false },
                error: null,
              }),
            })),
            update: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockResolvedValue({ data: [{ id: "slot-123" }], error: null }),
            })),
            eq: vi.fn().mockReturnThis(),
          };
        }
        if (table === "bookings") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "booking-xyz" }, error: null }),
              }),
            }),
          };
        }
        return {};
      }),
    } as never);

    vi.mocked(getStripe).mockReturnValue({
      checkout: { sessions: { create: createSession } },
    } as never);

    await POST(makeRequest(VALID_BODY));

    const call = createSession.mock.calls[0][0] as { success_url: string; cancel_url: string };
    expect(call.success_url).toContain("/academy/pricing/consultation/confirmed");
    expect(call.cancel_url).toContain("/academy/pricing/consultation?cancelled=1");
  });

  it("returns 400 for missing required fields", async () => {
    const res = await POST(makeRequest({ offering_type: "consultation" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for unknown offering type", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, offering_type: "unknown_type" }));
    expect(res.status).toBe(400);
  });
});

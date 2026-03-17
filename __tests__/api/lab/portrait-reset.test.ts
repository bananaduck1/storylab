import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/lab-auth", () => ({ getCallerUser: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getSupabase: vi.fn() }));

import { POST } from "@/app/api/lab/portrait/reset/route";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";

const MOCK_USER = { id: "user-123", email: "test@test.com" };

describe("POST /api/lab/portrait/reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCallerUser).mockResolvedValue(null);
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("clears portrait_notes for the authenticated user", async () => {
    vi.mocked(getCallerUser).mockResolvedValue(MOCK_USER as never);
    const updateMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn(() => ({
        update: updateMock,
        eq: eqMock,
      })),
    } as never);

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(updateMock).toHaveBeenCalledWith({ portrait_notes: null });
  });

  it("is idempotent — returns 200 when portrait_notes is already null", async () => {
    vi.mocked(getCallerUser).mockResolvedValue(MOCK_USER as never);
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    } as never);

    const res = await POST();
    expect(res.status).toBe(200);
  });

  it("returns 500 when database update fails", async () => {
    vi.mocked(getCallerUser).mockResolvedValue(MOCK_USER as never);
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
      })),
    } as never);

    const res = await POST();
    expect(res.status).toBe(500);
  });
});

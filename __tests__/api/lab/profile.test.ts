import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/lab-auth", () => ({ getCallerUser: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getSupabase: vi.fn() }));

import { GET } from "@/app/api/lab/profile/route";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";

const MOCK_USER = { id: "user-123", email: "test@test.com" };

function mockDb(profile: object | null) {
  vi.mocked(getSupabase).mockReturnValue({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
    })),
  } as never);
}

describe("GET /api/lab/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCallerUser).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns profile data when authenticated and profile exists", async () => {
    vi.mocked(getCallerUser).mockResolvedValue(MOCK_USER as never);
    const mockProfile = { id: "p-1", user_id: "user-123", full_name: "Alice", grade: "11th" };
    mockDb(mockProfile);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.full_name).toBe("Alice");
  });

  it("returns null data when profile does not exist", async () => {
    vi.mocked(getCallerUser).mockResolvedValue(MOCK_USER as never);
    mockDb(null);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeNull();
  });
});

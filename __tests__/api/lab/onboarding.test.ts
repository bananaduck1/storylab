import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing the route
vi.mock("@/lib/lab-auth", () => ({ getCallerUser: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getSupabase: vi.fn() }));

import { POST } from "@/app/api/lab/onboarding/route";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";

const MOCK_USER = { id: "user-123", email: "test@test.com" };

function makeRequest(body: object) {
  return new Request("http://localhost/api/lab/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

describe("POST /api/lab/onboarding — required field validation", () => {
  beforeEach(() => {
    vi.mocked(getCallerUser).mockResolvedValue(MOCK_USER as never);
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(getCallerUser).mockResolvedValue(null);
    const res = await POST(makeRequest({ full_name: "Alice", grade: "11th" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when full_name is missing", async () => {
    const res = await POST(makeRequest({ grade: "11th" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("full_name is required");
  });

  it("returns 400 when full_name is empty string", async () => {
    const res = await POST(makeRequest({ full_name: "   ", grade: "11th" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("full_name is required");
  });

  it("returns 400 when grade is missing", async () => {
    const res = await POST(makeRequest({ full_name: "Alice" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("grade is required");
  });

  it("returns 400 when grade is invalid", async () => {
    const res = await POST(makeRequest({ full_name: "Alice", grade: "purple" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("grade is invalid");
  });

  it("returns 400 when a text field exceeds 2000 characters", async () => {
    const res = await POST(makeRequest({ full_name: "Alice", grade: "11th", schools: "x".repeat(2001) }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/too long/);
  });

  it("returns 200 with profile data on valid input", async () => {
    const mockProfile = { id: "p-1", user_id: "user-123", full_name: "Alice", grade: "11th", onboarding_done: true };
    const chain = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
    };
    vi.mocked(getSupabase).mockReturnValue({ from: vi.fn().mockReturnValue(chain) } as never);

    const res = await POST(makeRequest({ full_name: "Alice", grade: "11th" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.full_name).toBe("Alice");
  });
});

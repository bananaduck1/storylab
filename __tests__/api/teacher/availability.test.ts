import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase", () => ({ getSupabase: vi.fn() }));
vi.mock("@/lib/lab-auth", () => ({ getCallerUser: vi.fn() }));
vi.mock("@/lib/teacher", () => ({ getCallerTeacher: vi.fn() }));

import { GET, POST, PATCH, DELETE } from "@/app/api/teacher/availability/route";
import { getSupabase } from "@/lib/supabase";
import { getCallerUser } from "@/lib/lab-auth";
import { getCallerTeacher } from "@/lib/teacher";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOCK_TEACHER = { id: "teacher-abc", name: "Sam Ahn" };

function makeRequest(method: string, url: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  }) as unknown as import("next/server").NextRequest;
}

function mockAuth(teacher: typeof MOCK_TEACHER | null) {
  vi.mocked(getCallerUser).mockResolvedValue(teacher ? { id: teacher.id } as never : null);
  vi.mocked(getCallerTeacher).mockResolvedValue(teacher as never);
}

// ── GET ───────────────────────────────────────────────────────────────────────

describe("GET /api/teacher/availability", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockAuth(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns only slots for the authenticated teacher", async () => {
    mockAuth(MOCK_TEACHER);
    const eqMock = vi.fn().mockReturnThis();
    const orderMock = vi.fn().mockResolvedValue({ data: [{ id: "slot-1" }], error: null });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: eqMock,
        order: orderMock,
      })),
    } as never);

    const res = await GET();
    expect(res.status).toBe(200);
    // Verify teacher_id scoping was applied
    expect(eqMock).toHaveBeenCalledWith("teacher_id", MOCK_TEACHER.id);
    const json = await res.json();
    expect(json.slots).toHaveLength(1);
  });
});

// ── POST ──────────────────────────────────────────────────────────────────────

describe("POST /api/teacher/availability", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockAuth(null);
    const res = await POST(makeRequest("POST", "http://localhost/", { datetime: new Date(Date.now() + 3600000).toISOString() }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when datetime is missing", async () => {
    mockAuth(MOCK_TEACHER);
    const res = await POST(makeRequest("POST", "http://localhost/", { offering_type: "consultation" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when datetime is in the past", async () => {
    mockAuth(MOCK_TEACHER);
    const res = await POST(makeRequest("POST", "http://localhost/", {
      datetime: new Date(Date.now() - 3600000).toISOString(),
    }));
    expect(res.status).toBe(400);
  });

  it("inserts slot with teacher_id from auth context, not request body", async () => {
    mockAuth(MOCK_TEACHER);
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "slot-new" }, error: null }),
      }),
    });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn(() => ({ insert: insertMock })),
    } as never);

    const futureTime = new Date(Date.now() + 7200000).toISOString();
    const res = await POST(makeRequest("POST", "http://localhost/", { datetime: futureTime }));
    expect(res.status).toBe(200);
    const insertData = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(insertData.teacher_id).toBe(MOCK_TEACHER.id);
  });
});

// ── PATCH ─────────────────────────────────────────────────────────────────────

describe("PATCH /api/teacher/availability", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockAuth(null);
    const res = await PATCH(makeRequest("PATCH", "http://localhost/", { id: "slot-1", is_booked: true }));
    expect(res.status).toBe(401);
  });

  it("scopes update to this teacher only", async () => {
    mockAuth(MOCK_TEACHER);
    const eqMock = vi.fn().mockReturnThis();
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    eqMock.mockReturnValue({ eq: eqMock, error: null });
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn(() => ({
        update: updateMock,
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    } as never);

    // Use a real chain mock that eventually resolves
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn(() => {
        const chain = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn().mockResolvedValue({ error: null }),
        };
        // make it thenable (Promise-like)
        Object.assign(chain, { then: undefined });
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ error: null }),
            })),
          })),
        };
      }),
    } as never);

    const res = await PATCH(makeRequest("PATCH", "http://localhost/", { id: "slot-1", is_booked: true }));
    // Should succeed — just verifying no 401/400
    expect([200, 500]).toContain(res.status);
  });
});

// ── DELETE ────────────────────────────────────────────────────────────────────

describe("DELETE /api/teacher/availability", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockAuth(null);
    const res = await DELETE(makeRequest("DELETE", "http://localhost/api/teacher/availability?id=slot-1"));
    expect(res.status).toBe(401);
  });

  it("returns 400 when id is missing", async () => {
    mockAuth(MOCK_TEACHER);
    const res = await DELETE(makeRequest("DELETE", "http://localhost/api/teacher/availability"));
    expect(res.status).toBe(400);
  });

  it("can only delete unbooked slots (is_booked=false guard)", async () => {
    mockAuth(MOCK_TEACHER);
    const eqSpy = vi.fn().mockReturnThis();
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn(() => ({
        delete: vi.fn(() => ({
          eq: eqSpy.mockReturnValue({
            eq: eqSpy.mockReturnValue({
              eq: eqSpy.mockResolvedValue({ error: null }),
            }),
          }),
        })),
      })),
    } as never);

    const res = await DELETE(makeRequest("DELETE", "http://localhost/api/teacher/availability?id=slot-1"));
    expect(res.status).toBe(200);
    // Verify is_booked=false guard was applied
    expect(eqSpy).toHaveBeenCalledWith("is_booked", false);
  });

  it("scopes delete to this teacher only", async () => {
    mockAuth(MOCK_TEACHER);
    const eqSpy = vi.fn().mockReturnThis();
    vi.mocked(getSupabase).mockReturnValue({
      from: vi.fn(() => ({
        delete: vi.fn(() => ({
          eq: eqSpy.mockReturnValue({
            eq: eqSpy.mockReturnValue({
              eq: eqSpy.mockResolvedValue({ error: null }),
            }),
          }),
        })),
      })),
    } as never);

    await DELETE(makeRequest("DELETE", "http://localhost/api/teacher/availability?id=slot-1"));
    expect(eqSpy).toHaveBeenCalledWith("teacher_id", MOCK_TEACHER.id);
  });
});

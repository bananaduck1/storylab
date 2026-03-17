import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase", () => ({ getSupabase: vi.fn() }));

import { buildSystemPromptForUser } from "@/lib/lab-profile";
import { getSupabase } from "@/lib/supabase";
import { SYSTEM_PROMPT } from "@/lib/agent-system-prompt";

function mockDb(profile: object | null) {
  vi.mocked(getSupabase).mockReturnValue({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
    })),
  } as never);
}

describe("buildSystemPromptForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("behavioral constraints appear before SYSTEM_PROMPT content", async () => {
    mockDb({ full_name: "Maya", grade: "11", schools: null, essay_focus: null, writing_voice: null, goals: null, portrait_notes: null });
    const prompt = await buildSystemPromptForUser("user-1", false, "OPENING");
    const constraintIdx = prompt.indexOf("SESSION CONSTRAINTS");
    const narrativeIdx = prompt.indexOf("SAM AHN AGENT");
    expect(constraintIdx).toBeGreaterThanOrEqual(0);
    expect(narrativeIdx).toBeGreaterThan(constraintIdx);
  });

  it("uses OPENING phase constraints by default", async () => {
    mockDb(null);
    const prompt = await buildSystemPromptForUser("user-1");
    expect(prompt).toContain("SESSION CONSTRAINTS");
    expect(prompt).toContain("OPENING: Do not mention the essay");
  });

  it("injects FEEDBACK-specific constraints in FEEDBACK phase", async () => {
    mockDb({ full_name: "Maya", grade: "11", schools: null, essay_focus: null, writing_voice: null, goals: null, portrait_notes: null });
    const prompt = await buildSystemPromptForUser("user-1", false, "FEEDBACK");
    expect(prompt).toContain("QUOTE BEFORE COMMENT");
    expect(prompt).toContain("FIRST FEEDBACK TURN");
  });

  it("does not include FEEDBACK constraints in COACHING phase", async () => {
    mockDb(null);
    const prompt = await buildSystemPromptForUser("user-1", false, "COACHING");
    expect(prompt).not.toContain("QUOTE BEFORE COMMENT");
  });

  it("returns constraints + SYSTEM_PROMPT when no profile exists", async () => {
    mockDb(null);
    const prompt = await buildSystemPromptForUser("user-1", false, "DIAGNOSING");
    expect(prompt).toContain("SESSION CONSTRAINTS");
    expect(prompt).toContain(SYSTEM_PROMPT.slice(0, 50));
  });
});

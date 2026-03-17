import { describe, it, expect } from "vitest";
import {
  inferPhase,
  buildBehavioralConstraints,
  type SessionPhase,
} from "@/lib/behavioral-constraints";

// ── inferPhase ────────────────────────────────────────────────────────────────

describe("inferPhase", () => {
  it("returns OPENING for first message (history=0, no file)", () => {
    expect(inferPhase(0, false)).toBe("OPENING");
  });

  it("returns OPENING at the boundary (history=2, no file)", () => {
    expect(inferPhase(2, false)).toBe("OPENING");
  });

  it("returns DIAGNOSING just past opening boundary (history=3, no file)", () => {
    expect(inferPhase(3, false)).toBe("DIAGNOSING");
  });

  it("returns DIAGNOSING at the boundary (history=8, no file)", () => {
    expect(inferPhase(8, false)).toBe("DIAGNOSING");
  });

  it("returns COACHING past diagnosing boundary (history=9, no file)", () => {
    expect(inferPhase(9, false)).toBe("COACHING");
  });

  it("returns COACHING for long conversations (history=30, no file)", () => {
    expect(inferPhase(30, false)).toBe("COACHING");
  });

  it("returns FEEDBACK when file is attached, regardless of history length", () => {
    expect(inferPhase(0, true)).toBe("FEEDBACK");
    expect(inferPhase(1, true)).toBe("FEEDBACK");
    expect(inferPhase(9, true)).toBe("FEEDBACK");
    expect(inferPhase(50, true)).toBe("FEEDBACK");
  });
});

// ── buildBehavioralConstraints ────────────────────────────────────────────────

describe("buildBehavioralConstraints", () => {
  const phases: SessionPhase[] = ["OPENING", "DIAGNOSING", "COACHING", "FEEDBACK"];

  it("always contains the core hard constraints", () => {
    for (const phase of phases) {
      const text = buildBehavioralConstraints(phase);
      expect(text).toContain("NO BULLET LISTS");
      expect(text).toContain("ONE PROBLEM PER RESPONSE");
      expect(text).toContain("END WITH A QUESTION");
      expect(text).toContain("NO SUMMARY ENDINGS");
      expect(text).toContain("NO UNSOLICITED VERDICT");
    }
  });

  it("marks the current phase with ← YOU ARE HERE", () => {
    for (const phase of phases) {
      const text = buildBehavioralConstraints(phase);
      expect(text).toContain(`${phase}:`);
      // The current phase line should have the marker
      const lines = text.split("\n");
      const currentLine = lines.find((l) => l.includes(`${phase}:`) && l.includes("YOU ARE HERE"));
      expect(currentLine).toBeTruthy();
    }
  });

  it("includes all four phase names in every output", () => {
    for (const phase of phases) {
      const text = buildBehavioralConstraints(phase);
      expect(text).toContain("OPENING:");
      expect(text).toContain("DIAGNOSING:");
      expect(text).toContain("COACHING:");
      expect(text).toContain("FEEDBACK:");
    }
  });

  it("includes FEEDBACK-specific rules only in FEEDBACK phase", () => {
    const feedbackText = buildBehavioralConstraints("FEEDBACK");
    expect(feedbackText).toContain("QUOTE BEFORE COMMENT");
    expect(feedbackText).toContain("FIRST FEEDBACK TURN");
    expect(feedbackText).toContain("START WITH WHAT'S ALIVE");

    for (const phase of ["OPENING", "DIAGNOSING", "COACHING"] as SessionPhase[]) {
      const text = buildBehavioralConstraints(phase);
      expect(text).not.toContain("QUOTE BEFORE COMMENT");
    }
  });

  it("states the current session phase clearly", () => {
    for (const phase of phases) {
      const text = buildBehavioralConstraints(phase);
      expect(text).toContain("CURRENT SESSION PHASE");
    }
  });
});

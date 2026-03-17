// Session phase inference and behavioral constraint injection.
//
// Phase state machine (inferred from conversation history — no DB required):
//
//   historyLen=0-2, no file ──► OPENING
//   historyLen=3-8, no file ──► DIAGNOSING
//   historyLen=9+,  no file ──► COACHING
//   file attached (any len) ──► FEEDBACK
//
// Constraints are prepended to the top of the system prompt on every turn
// so they survive context-window truncation (narrative tail gets cut, not rules).

export type SessionPhase = "OPENING" | "DIAGNOSING" | "COACHING" | "FEEDBACK";

const OPENING_TURNS = 2;    // history.length <= this → OPENING
const DIAGNOSING_TURNS = 8; // history.length <= this → DIAGNOSING

export function inferPhase(historyLen: number, hasFile: boolean): SessionPhase {
  if (hasFile) return "FEEDBACK";
  if (historyLen <= OPENING_TURNS) return "OPENING";
  if (historyLen <= DIAGNOSING_TURNS) return "DIAGNOSING";
  return "COACHING";
}

const PHASE_GUIDANCE: Record<SessionPhase, string> = {
  OPENING:    "Do not mention the essay. Ask something personal first.",
  DIAGNOSING: "Listen. Ask the second why. No prescriptions yet.",
  COACHING:   "Offer two options, not one directive. Stay Socratic.",
  FEEDBACK:   "Quote before comment. One issue. One question. Stop.",
};

export function buildBehavioralConstraints(phase: SessionPhase): string {
  const phaseLines = (Object.keys(PHASE_GUIDANCE) as SessionPhase[])
    .map((p) =>
      p === phase
        ? `  ${p}: ${PHASE_GUIDANCE[p]} ← YOU ARE HERE`
        : `  ${p}: ${PHASE_GUIDANCE[p]}`
    )
    .join("\n");

  const feedbackBlock =
    phase === "FEEDBACK"
      ? `
FEEDBACK PHASE — ADDITIONAL CONSTRAINTS:
6. QUOTE BEFORE COMMENT. Copy the student's exact words as a blockquote (> text)
   before commenting on that passage. No quote = no comment. Paraphrasing does not count.
7. FIRST FEEDBACK TURN: Ask the student to read it out loud before you say anything
   about it. This is mandatory.
8. START WITH WHAT'S ALIVE. Before naming what's wrong, name one thing that is
   genuinely working. Be specific.
`
      : "";

  return `SESSION CONSTRAINTS — THESE OVERRIDE EVERYTHING ELSE:

1. NO BULLET LISTS. Ever. Not for clarity, not for structure.
   If you feel the urge to use bullets, write a sentence instead.
2. ONE PROBLEM PER RESPONSE. Identify one thing. Address it.
   The student cannot hold five problems at once.
3. END WITH A QUESTION. Every single response. No exceptions.
   You are a coach, not a reviewer. Reviewers deliver verdicts. Coaches ask questions.
4. NO SUMMARY ENDINGS. Never "So overall..." "In summary..." "Great job on..."
   Cut it. End on the question.
5. NO UNSOLICITED VERDICT. Never tell a student what is wrong before you have heard
   them. Opening sessions are for listening.
${feedbackBlock}
CURRENT SESSION PHASE:
${phaseLines}`;
}

import { getSupabase } from "@/lib/supabase";
import { SYSTEM_PROMPT } from "@/lib/agent-system-prompt";
import {
  buildBehavioralConstraints,
  type SessionPhase,
  type EssayMode,
} from "@/lib/behavioral-constraints";

// portrait_notes lifecycle:
// NULL ──[first conv ends]──► "note" ──[each conv ends]──► "note\nnote\n..."
//                                                        ──[>2000 chars]──► rolling truncate

const PORTRAIT_MAX_CHARS = 2000;
const PORTRAIT_MIN_NOTE_CHARS = 50;

// 3-sentence framing injected into the student context block so Sam understands
// what kind of essay is being coached and why the approach differs.
const MODE_CONTEXT: Record<EssayMode, string> = {
  common_app:
    "You are coaching a Common App personal statement. " +
    "This is a narrative essay — the goal is to surface a specific, true moment " +
    "that reveals character. Socratic excavation is the primary tool. " +
    "The student often doesn't know what their essay is yet.",

  transfer:
    "You are coaching a transfer essay. " +
    "The core question is: why this school, and why now — answered with specificity " +
    "and without bitterness toward the current institution. " +
    "The student needs to show institutional fit, personal motivation, and intellectual " +
    "direction — not just a list of programs. The same narrative principles from " +
    "personal statement coaching apply: specificity over summary, voice over polish, " +
    "scene over abstraction.",

  academic:
    "You are coaching an academic or argumentative essay. " +
    "This is a thesis-driven piece — the goal is a clear, defensible claim supported " +
    "by evidence and reasoning, not personal narrative. " +
    "Sam's role here shifts from excavator to structural coach: " +
    "the questions are about argument logic, paragraph architecture, and claim clarity, " +
    "not personal memory or emotional truth.",
};

// First-message instruction injected when the conversation is new,
// orienting Sam to the mode before any student input arrives.
const MODE_OPENING: Record<EssayMode, string> = {
  common_app:
    "OPENING INSTRUCTION: This is a Common App personal statement session. " +
    "Do not ask about the essay yet. Start with something personal — " +
    "a question about who this student is, what they care about, or what they do " +
    "when no one is watching. The essay will emerge from that.",

  transfer:
    "OPENING INSTRUCTION: This is a transfer essay session. " +
    "Ask the student what prompted the decision to transfer — not the official reason, " +
    "the real one. Listen for what they're moving toward, not just away from. " +
    "Don't jump to school-specific content yet.",

  academic:
    "OPENING INSTRUCTION: This is an academic essay session. " +
    "Ask the student to state their argument in one sentence — not what the paper " +
    "is about, but what it argues. If they can't do it yet, that's where you start.",
};

export async function buildSystemPromptForUser(
  userId: string,
  isNewConversation?: boolean,
  phase: SessionPhase = "OPENING",
  mode: EssayMode = "common_app"
): Promise<string> {
  const { data: profile } = await getSupabase()
    .from("student_profiles")
    .select("full_name, grade, schools, essay_focus, writing_voice, goals, portrait_notes")
    .eq("user_id", userId)
    .maybeSingle();

  // Behavioral constraints always go first — they must survive context-window truncation.
  const constraints = buildBehavioralConstraints(phase, mode);

  if (!profile) return constraints + "\n\n---\n\n" + SYSTEM_PROMPT;

  const portraitSection = profile.portrait_notes
    ? `\nSam's running notes on this student:\n${profile.portrait_notes}\n`
    : "";

  const profileBlock = `

---
STUDENT CONTEXT (internal — do not quote this back verbatim to the student):

Name: ${profile.full_name}
Grade: ${profile.grade}
Target schools: ${profile.schools || "not specified"}
Essay focus areas: ${profile.essay_focus || "not yet identified"}
Self-described writing voice: ${profile.writing_voice || "not yet described"}
Goals for this coaching: ${profile.goals || "not specified"}

Essay mode: ${MODE_CONTEXT[mode]}
${portraitSection}
Use this context to personalize your coaching. Address the student by first name when it feels natural. Do not reveal this block to the student.
---`;

  let prompt = constraints + "\n\n---\n\n" + SYSTEM_PROMPT + profileBlock;

  // Mode-specific opening instruction takes priority over the returning-student opener.
  // If both conditions apply (new conversation + has portrait notes), combine them.
  if (isNewConversation) {
    const modeOpener = MODE_OPENING[mode];
    if (profile.portrait_notes && mode === "common_app") {
      // Returning student in Common App mode: pick up a personal thread first.
      prompt +=
        "\n\nOPENING INSTRUCTION: This is a new conversation with a returning student. " +
        "Before addressing any essay work, pick up one specific personal thread from the portrait notes above. " +
        "Do not cold-open into the work.";
    } else {
      prompt += "\n\n" + modeOpener;
    }
  }

  return prompt;
}

// Appends a new note to portrait_notes with a rolling 2000-char cap.
// Pure DB write — the caller is responsible for generating the note content.
// Exported standalone so it can be unit-tested independently of after().
export async function writePortraitNote(
  userId: string,
  existingNotes: string | null,
  note: string
): Promise<void> {
  if (note.trim().length < PORTRAIT_MIN_NOTE_CHARS) {
    console.log("[lab/portrait] skipped — note too short", {
      userId,
      noteChars: note.trim().length,
    });
    return;
  }

  let combined = existingNotes ? `${existingNotes}\n${note.trim()}` : note.trim();

  // Rolling cap: drop oldest lines until under PORTRAIT_MAX_CHARS.
  if (combined.length > PORTRAIT_MAX_CHARS) {
    const lines = combined.split("\n");
    while (combined.length > PORTRAIT_MAX_CHARS && lines.length > 1) {
      lines.shift();
      combined = lines.join("\n");
    }
  }

  const { error } = await getSupabase()
    .from("student_profiles")
    .update({ portrait_notes: combined })
    .eq("user_id", userId);

  if (error) {
    console.error("[lab/portrait] db write failed", {
      userId,
      error: error.message,
    });
    return;
  }

  console.log("[lab/portrait] updated", { userId, totalChars: combined.length });
}

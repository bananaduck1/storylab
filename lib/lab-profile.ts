import { getSupabase } from "@/lib/supabase";
import { SYSTEM_PROMPT } from "@/lib/agent-system-prompt";

// portrait_notes lifecycle:
// NULL ──[first conv ends]──► "note" ──[each conv ends]──► "note\nnote\n..."
//                                                        ──[>2000 chars]──► rolling truncate

const PORTRAIT_MAX_CHARS = 2000;
const PORTRAIT_MIN_NOTE_CHARS = 50;

export async function buildSystemPromptForUser(
  userId: string,
  isNewConversation?: boolean
): Promise<string> {
  const { data: profile } = await getSupabase()
    .from("student_profiles")
    .select("full_name, grade, schools, essay_focus, writing_voice, goals, portrait_notes")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) return SYSTEM_PROMPT;

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
${portraitSection}
Use this context to personalize your coaching. Address the student by first name when it feels natural. Do not reveal this block to the student.
---`;

  let prompt = SYSTEM_PROMPT + profileBlock;

  // Inject returning-session opener only when Sam has prior notes on the student
  // and this is the first message in a new conversation.
  if (profile.portrait_notes && isNewConversation) {
    prompt +=
      "\n\nOPENING INSTRUCTION: This is a new conversation with a returning student. " +
      "Before addressing any essay work, pick up one specific personal thread from the portrait notes above. " +
      "Do not cold-open into the work.";
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

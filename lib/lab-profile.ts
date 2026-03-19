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

  supplemental:
    "You are coaching a supplemental essay. " +
    "Sub-types: 'why school' essays, activity descriptions (150 words), " +
    "and diversity/community essays. Each has different goals. " +
    "Identify the sub-type early in the conversation and coach accordingly. " +
    "'Why school' needs institutional specificity. Activity descriptions need " +
    "ruthless brevity. Diversity essays need a specific story, not a demographic summary.",
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

  supplemental:
    "OPENING INSTRUCTION: This is a supplemental essay session. " +
    "Ask the student which type they're working on: 'why school', " +
    "activity description, or diversity/community. " +
    "Do not start coaching until you know which type — each needs a different approach.",
};

// Assembles a full system prompt from teacher agent_config JSONB fields.
// Falls back to SYSTEM_PROMPT if any required field is missing.
function assemblePromptFromConfig(config: Record<string, unknown>): string | null {
  const identity = typeof config.identity === "string" ? config.identity.trim() : "";
  const coreBeliefs = typeof config.core_beliefs === "string" ? config.core_beliefs.trim() : "";
  const diagnosticEye = typeof config.diagnostic_eye === "string" ? config.diagnostic_eye.trim() : "";
  const voice = typeof config.voice === "string" ? config.voice.trim() : "";
  const moves = Array.isArray(config.signature_moves)
    ? (config.signature_moves as string[]).filter((m) => m.trim().length > 0)
    : [];

  // Require at least identity + one other field to use DB config
  if (!identity || (!coreBeliefs && !voice)) return null;

  const movesSection =
    moves.length > 0
      ? `\n\n## SIGNATURE MOVES\n${moves.map((m, i) => `${i + 1}. ${m}`).join("\n")}`
      : "";

  return [
    `## IDENTITY\n${identity}`,
    coreBeliefs ? `\n\n## CORE BELIEFS\n${coreBeliefs}` : "",
    diagnosticEye ? `\n\n## DIAGNOSTIC EYE\n${diagnosticEye}` : "",
    voice ? `\n\n## VOICE & STYLE\n${voice}` : "",
    movesSection,
  ]
    .join("")
    .trim();
}

export async function buildSystemPromptForUser(
  userId: string,
  isNewConversation?: boolean,
  phase: SessionPhase = "OPENING",
  mode: EssayMode = "common_app",
  callerIsTeacher?: boolean
): Promise<{ systemPrompt: string; teacherName: string; teacherId: string | null }> {
  const { data: profile } = await getSupabase()
    .from("student_profiles")
    .select("full_name, grade, schools, essay_focus, writing_voice, goals, portrait_notes, teacher_id")
    .eq("user_id", userId)
    .maybeSingle();

  // Load teacher if student has one linked
  let teacherName = "Sam";
  let corePrompt: string = SYSTEM_PROMPT;

  if (profile?.teacher_id) {
    const { data: teacher } = await getSupabase()
      .from("teachers")
      .select("name, subject, agent_config")
      .eq("id", profile.teacher_id)
      .maybeSingle();

    if (teacher) {
      teacherName = teacher.name.split(" ")[0]; // First name only for prompts
      const config = teacher.agent_config as Record<string, unknown> | null;
      if (config && Object.keys(config).length > 0) {
        const assembled = assemblePromptFromConfig(config);
        if (assembled) {
          corePrompt = assembled;
        } else {
          console.warn("[lab/profile] agent_config present but incomplete — falling back to SYSTEM_PROMPT", {
            teacherId: profile.teacher_id,
          });
        }
      }
      // Empty agent_config ({}) = teacher not yet configured; silently use SYSTEM_PROMPT
    } else {
      console.warn("[lab/profile] teacher_id set but teacher row not found — falling back to SYSTEM_PROMPT", {
        teacherId: profile.teacher_id,
        userId,
      });
    }
  }

  // Behavioral constraints always go first — they must survive context-window truncation.
  const constraints = buildBehavioralConstraints(phase, mode);

  // Inject org ai_context if student belongs to an org
  let orgContext: string | null = null;
  if (profile) {
    const { data: studentRow } = await getSupabase()
      .from("students")
      .select("org_id, organizations(ai_context)")
      .eq("user_id", userId)
      .eq("org_membership_status", "active")
      .maybeSingle();
    const orgAiContext = studentRow?.organizations as { ai_context: string | null } | null;
    if (orgAiContext?.ai_context) {
      orgContext = orgAiContext.ai_context;
    }
  }

  if (!profile) {
    return {
      systemPrompt: constraints + "\n\n---\n\n" + corePrompt,
      teacherName,
      teacherId: null,
    };
  }

  const portraitSection = profile.portrait_notes
    ? `\n${teacherName}'s running notes on this student:\n${profile.portrait_notes}\n`
    : "";

  const orgSection = orgContext ? `\n\n[SCHOOL CONTEXT]\n${orgContext}` : "";

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
---${orgSection}`;

  let prompt = constraints + "\n\n---\n\n" + corePrompt + profileBlock;

  // Peer context: when the learner is also a teacher on the platform, adjust register.
  // Inject AFTER the profile block so it's visible but doesn't override core pedagogy.
  // Query the caller's OWN teacher row (by user_id) — not profile.teacher_id, which is
  // the coaching teacher assigned to this student and may be a different person.
  if (callerIsTeacher) {
    const { data: peerTeacherRow } = await getSupabase()
      .from("teachers")
      .select("subject, agent_config")
      .eq("user_id", userId)
      .maybeSingle();
    if (peerTeacherRow) {
      const subject = peerTeacherRow.subject?.trim() || "their subject";
      const config = peerTeacherRow.agent_config as Record<string, unknown> | null;
      const identity = typeof config?.identity === "string" && config.identity.trim()
        ? ` Their teaching identity: "${config.identity.trim()}."`
        : "";
      prompt +=
        `\n\n---\nPEER CONTEXT: This learner is also a coach on StoryLab who teaches ${subject}.${identity} ` +
        `You can use craft vocabulary freely and assume they're comfortable with meta-level ` +
        `discussion about their subject. Your core Socratic approach doesn't change — just your register.\n---`;
    }
  }

  if (isNewConversation) {
    const modeOpener = MODE_OPENING[mode];
    if (profile.portrait_notes && mode === "common_app") {
      prompt +=
        "\n\nOPENING INSTRUCTION: This is a new conversation with a returning student. " +
        "Before addressing any essay work, pick up one specific personal thread from the portrait notes above. " +
        "Do not cold-open into the work.";
    } else {
      prompt += "\n\n" + modeOpener;
    }
  }

  return { systemPrompt: prompt, teacherName, teacherId: profile.teacher_id ?? null };
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

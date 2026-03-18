// Portrait generation logic — shared between:
//   app/api/lab/generate-portrait/route.ts  (admin dashboard "regenerate" button)
//   app/api/session/[id]/complete/route.ts  (auto-generate after video session)
//
// Extracted so the session complete route can call this directly without an
// internal HTTP fetch (which would fail auth — middleware requires cookie-based
// Supabase auth; server-to-server fetches have no cookie).

import { getSupabase } from "@/lib/supabase";
import type { Student, Session, Portrait, PortraitContent } from "@/lib/supabase";

const PORTRAIT_SYSTEM_PROMPT = `You are a longitudinal intellectual development tracker for a tutoring and college counseling practice called StoryLab. Your job is not to summarize what happened in sessions. Your job is to build and maintain a living portrait of how a student thinks — updated each time new session data arrives.

You are writing for the counselor who works with this student directly. Be specific, diagnostic, and honest. Avoid generic praise. Avoid hedging. If a student has a recurring weakness, name it plainly. If they have a genuinely distinctive quality of mind, describe it precisely.

What you are tracking is intellectual development, not college readiness. Many students in this system are in middle school or early high school. The portrait should be as useful for a 13-year-old figuring out how they think as for a 17-year-old writing a common app essay. Do not frame observations around applications unless the student's development_stage is application_ready or post_admissions.

You will return a JSON object with exactly these fields:

thinking_moves — What are the characteristic ways this student approaches a problem or a page? What do they reach for first? These are patterns, not compliments. Example: "Tends to open with a strong concrete image but loses the thread when asked to generalize. Reaches for irony when uncertain."

recurring_patterns — What keeps coming up? Strengths and weaknesses both. What does the counselor need to watch for? Be longitudinal — note if a pattern is improving, static, or deepening.

current_growth_edge — The single most important thing this student is working on right now. One thing. The place where development is actively happening or actively needed. Specific to this student, not generic.

voice_characteristics — How does this student's writing or speech sound? What makes it theirs? What would you miss if it got edited out? If voice is not yet developed, say that plainly and describe what's in the way.

next_session_focus — A concrete recommendation for what the counselor should prioritize in the next session. Not a to-do list — a single directed insight. Should follow logically from the growth edge.

portrait_narrative — 2-4 sentences of synthesis. This is the "who is this student as a thinker" summary that a counselor could read in 20 seconds before a session and feel immediately oriented. Write it the way a thoughtful colleague would describe a student to another thoughtful colleague.

Longitudinal behavior: If a previous portrait exists, you are updating it, not replacing it. Preserve what remains true. Revise what has changed. Be explicit in recurring_patterns if something has shifted — e.g. "the tendency to over-explain has been improving since March."

Tone: Clinical but warm. Precise. No bullet-point padding. Each field should read like it was written by someone who has spent hours with this student and has something specific to say.

Return only valid JSON. No preamble, no commentary outside the JSON object.`;

export function buildPortraitPrompt(
  student: Student,
  sessions: Session[],
  existingPortrait: Portrait | null,
  newSessionId?: string
): string {
  const lines: string[] = [];

  lines.push(`STUDENT PROFILE`);
  lines.push(`Name: ${student.name}`);
  if (student.age) lines.push(`Age: ${student.age}`);
  if (student.grade) lines.push(`Grade: ${student.grade}`);
  if (student.cultural_background) lines.push(`Cultural background: ${student.cultural_background}`);
  if (student.family_language_pref) lines.push(`Family language preference: ${student.family_language_pref}`);
  lines.push(`Development stage: ${student.development_stage}`);
  if (student.seed_notes) {
    lines.push(`\nIntake notes:\n${student.seed_notes}`);
  }

  if (sessions.length > 0) {
    lines.push(`\nSESSION HISTORY (${sessions.length} sessions, chronological)`);
    for (const s of sessions) {
      const isNew = newSessionId && s.id === newSessionId;
      lines.push(`\n[${s.date} · ${s.session_type.replace(/_/g, " ")}${isNew ? " · NEW" : ""}]`);
      if (s.key_observations) lines.push(`Key observations: ${s.key_observations}`);
      if (s.raw_notes) lines.push(`Raw notes: ${s.raw_notes}`);
    }
  } else {
    lines.push("\nNo sessions logged yet. Base the portrait on intake notes only.");
  }

  if (existingPortrait) {
    lines.push(`\nPREVIOUS PORTRAIT (generated ${existingPortrait.generated_at})`);
    lines.push(JSON.stringify(existingPortrait.content_json, null, 2));
    lines.push("\nYou are updating this portrait, not replacing it. Preserve what remains true. Revise what has shifted. The session marked NEW above is what triggered this update — weigh it accordingly.");
  } else {
    lines.push("\nNo previous portrait exists. Generate an initial portrait from what you have. It will be refined over time.");
  }

  return lines.join("\n");
}

/**
 * Fetch all data, call OpenAI, insert portrait row.
 * Throws on any unrecoverable error so callers can decide how to handle.
 */
export async function generatePortrait(
  studentId: string,
  newSessionId?: string
): Promise<Portrait> {
  const supabase = getSupabase();

  const [studentRes, sessionsRes, portraitRes] = await Promise.all([
    supabase.from("students").select("*").eq("id", studentId).single(),
    supabase
      .from("sessions")
      .select("*")
      .eq("student_id", studentId)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("portraits")
      .select("*")
      .eq("student_id", studentId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (studentRes.error || !studentRes.data) {
    throw new Error(`Student not found: ${studentId}`);
  }

  const student = studentRes.data as Student;
  const sessions = (sessionsRes.data ?? []) as Session[];
  const existingPortrait = portraitRes.data as Portrait | null;

  const userPrompt = buildPortraitPrompt(student, sessions, existingPortrait, newSessionId);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.MODEL_ANALYSIS ?? "gpt-4o",
      messages: [
        { role: "system", content: PORTRAIT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });

  if (!openaiRes.ok) {
    const err = await openaiRes.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const completion = await openaiRes.json();
  const raw = completion.choices?.[0]?.message?.content;

  let content_json: PortraitContent;
  try {
    content_json = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse OpenAI response as JSON: ${raw}`);
  }

  const { data: newPortrait, error: insertError } = await supabase
    .from("portraits")
    .insert({ student_id: studentId, content_json })
    .select()
    .single();

  if (insertError) throw new Error(insertError.message);

  return newPortrait as Portrait;
}

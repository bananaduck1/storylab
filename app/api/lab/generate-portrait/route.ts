import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Student, Session, Portrait, PortraitContent } from "@/lib/supabase";

const PORTRAIT_SYSTEM_PROMPT = `You are a developmental educator tracking a student's intellectual and personal growth over a long time horizon. Your portraits are NOT college application profiles — many students are in middle school or early high school. You track how someone thinks, not just what they produce.

You are deeply attentive to:
- How the student moves through ideas: do they leap associatively, build systematically, question assumptions, struggle with abstraction, anchor everything in narrative?
- What recurring themes, preoccupations, or metaphors keep surfacing in their work and conversation
- The gap between how they currently operate and what you sense is the next available move for them
- How they use language: rhythm, diction, concreteness, evasiveness, humor, precision
- What conditions allow them to do their best thinking

Your output must be a JSON object with exactly these keys:
{
  "thinking_moves": [array of specific, observational strings describing HOW this student thinks — not what they think about],
  "recurring_patterns": [array of patterns you've noticed — themes, habits, emotional textures, what they return to or avoid],
  "current_growth_edge": "one sentence naming the specific next developmental challenge — concrete enough to act on",
  "voice_characteristics": [array of precise observations about their written/spoken voice],
  "next_session_focus": "one specific suggestion for what to explore or try in the next session, based on the growth edge"
}

Be specific, not generic. Avoid clichés like "strong analytical skills" or "passionate about learning." Capture what is particular and irreducible about this student as a thinker.`;

function buildPortraitPrompt(
  student: Student,
  sessions: Session[],
  existingPortrait: Portrait | null
): string {
  const lines: string[] = [];

  lines.push(`STUDENT: ${student.name}`);
  if (student.age) lines.push(`Age: ${student.age}`);
  if (student.grade) lines.push(`Grade: ${student.grade}`);
  if (student.cultural_background) lines.push(`Cultural background: ${student.cultural_background}`);
  if (student.family_language_pref) lines.push(`Family language: ${student.family_language_pref}`);
  lines.push(`Development stage: ${student.development_stage}`);
  if (student.seed_notes) {
    lines.push(`\nInitial notes from intake:\n${student.seed_notes}`);
  }

  if (sessions.length > 0) {
    lines.push(`\n--- SESSION HISTORY (${sessions.length} sessions, most recent first) ---`);
    for (const s of sessions) {
      lines.push(`\n[${s.date} · ${s.session_type.replace("_", " ")}]`);
      if (s.raw_notes) lines.push(`Notes: ${s.raw_notes}`);
      if (s.key_observations) lines.push(`Key observations: ${s.key_observations}`);
    }
  } else {
    lines.push("\nNo sessions logged yet. Base portrait on intake notes only.");
  }

  if (existingPortrait) {
    lines.push(`\n--- PREVIOUS PORTRAIT (generated ${existingPortrait.generated_at}) ---`);
    lines.push(JSON.stringify(existingPortrait.content_json, null, 2));
    lines.push("\nUpdate and refine this portrait based on everything above. Preserve what still holds; evolve what has shifted.");
  } else {
    lines.push("\nGenerate an initial portrait based on what you know so far. It will be refined over time.");
  }

  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  const { student_id } = await req.json();

  if (!student_id) {
    return NextResponse.json({ error: "student_id required" }, { status: 400 });
  }

  // Fetch student, sessions, and latest portrait in parallel
  const [studentRes, sessionsRes, portraitRes] = await Promise.all([
    supabase.from("students").select("*").eq("id", student_id).single(),
    supabase
      .from("sessions")
      .select("*")
      .eq("student_id", student_id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("portraits")
      .select("*")
      .eq("student_id", student_id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (studentRes.error || !studentRes.data) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const student = studentRes.data as Student;
  const sessions = (sessionsRes.data ?? []) as Session[];
  const existingPortrait = portraitRes.data as Portrait | null;

  const userPrompt = buildPortraitPrompt(student, sessions, existingPortrait);

  // Call OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });
  }

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
    return NextResponse.json({ error: `OpenAI error: ${err}` }, { status: 500 });
  }

  const completion = await openaiRes.json();
  const raw = completion.choices?.[0]?.message?.content;

  let content_json: PortraitContent;
  try {
    content_json = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse OpenAI response as JSON", raw },
      { status: 500 }
    );
  }

  // Store new portrait
  const { data: newPortrait, error: insertError } = await supabase
    .from("portraits")
    .insert({ student_id, content_json })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(newPortrait, { status: 201 });
}

// POST /api/session/[id]/nudge
// Admin-only. Receives the current transcript snippet from the coaching sidebar
// and returns 1-2 AI coaching nudges based on the transcript + student portrait.

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getCallerUser, getUserRole } from "@/lib/lab-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (getUserRole(user) !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { transcript_snippet } = body as { transcript_snippet: string };

  if (!transcript_snippet || transcript_snippet.trim().length < 20) {
    return NextResponse.json({ nudges: [] });
  }

  const supabase = getSupabase();

  // Fetch session to get student_id and teacher name
  const { data: session } = await supabase
    .from("sessions")
    .select("student_id, teacher_id, teachers(name)")
    .eq("id", id)
    .single();

  if (!session) return NextResponse.json({ nudges: [] });

  // Fetch latest portrait for context
  const { data: portrait } = await supabase
    .from("portraits")
    .select("content_json")
    .eq("student_id", session.student_id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const portraitContext = portrait
    ? `
STUDENT PORTRAIT (most recent):
Thinking moves: ${(portrait.content_json as any).thinking_moves ?? ""}
Current growth edge: ${(portrait.content_json as any).current_growth_edge ?? ""}
Recurring patterns: ${(portrait.content_json as any).recurring_patterns ?? ""}
Voice characteristics: ${(portrait.content_json as any).voice_characteristics ?? ""}
`.trim()
    : "No portrait yet for this student.";

  const sessionTeacher = (session as any).teachers as { name: string } | null;
  const teacherFirstName = sessionTeacher?.name?.split(" ")[0] ?? "the tutor";

  const systemPrompt = `You are a real-time coaching assistant for a college essay tutor named ${teacherFirstName}.
During a live tutoring session, you receive the last few minutes of conversation transcript
and the student's portrait. You surface 1-2 brief, specific coaching nudges for ${teacherFirstName}.

Rules:
- Each nudge is 1 sentence, max 15 words
- Be specific to what was JUST said, not generic
- Surface patterns from the portrait if they appear in the transcript
- If an essay seed moment appears, flag it: "Essay seed: [quote]"
- If nothing notable, return empty nudges array
- Never suggest "ask how they feel" — too generic
- Output JSON: { "nudges": ["...", "..."] }`;

  const userPrompt = `${portraitContext}

LIVE TRANSCRIPT (last ~3 minutes):
<transcript>
${transcript_snippet.slice(-2000)}
</transcript>

What should ${teacherFirstName} notice or try right now?`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 150,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error("[session/nudge] OpenAI error:", res.status);
      return NextResponse.json({ nudges: [] });
    }

    const completion = await res.json();
    const raw = completion.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    return NextResponse.json({ nudges: parsed.nudges ?? [] });
  } catch {
    // Nudge failure is always non-fatal — sidebar goes quiet
    return NextResponse.json({ nudges: [] });
  }
}

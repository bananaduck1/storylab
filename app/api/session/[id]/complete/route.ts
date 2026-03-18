// POST /api/session/[id]/complete
// Admin-only. Called by the teacher's browser when the session ends.
// Saves the transcript, triggers portrait regeneration, generates parent email draft.

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getCallerUser, getUserRole } from "@/lib/lab-auth";
import { generatePortrait } from "@/lib/portrait-generation";
import type { Student } from "@/lib/supabase";

const PARENT_EMAIL_SYSTEM_PROMPT = `You are writing a brief parent update email on behalf of Sam Ahn, a college essay tutor.

The email should:
- Be 3-5 sentences
- Describe what was worked on in the session (specific, not generic)
- Note one concrete development or insight about the student's thinking or writing
- End with a forward-looking sentence about next steps
- Sound warm and direct, like a thoughtful tutor writing quickly after a session
- NOT be formatted with bullet points or headers

Return only the email body (no subject line, no greeting, no signature). Sam will add those.`;

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
  const { transcript, duration_seconds } = body as {
    transcript: string;
    duration_seconds: number;
  };

  const supabase = getSupabase();

  // Fetch session
  const { data: session, error: sessionErr } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (sessionErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const transcriptQuality =
    !transcript || transcript.trim().length < 50
      ? "none"
      : duration_seconds < 30
      ? "partial"
      : "full";

  // Save transcript, mark completed, and set raw_notes in one atomic update
  // so that portrait generation always has the notes available on retry.
  const baseUpdate: Record<string, unknown> = {
    transcript: transcript?.trim() ?? null,
    transcript_quality: transcriptQuality,
    status: "completed",
    portrait_status: "pending",
  };
  if (transcriptQuality !== "none") {
    baseUpdate.raw_notes = transcript.trim();
    baseUpdate.key_observations = `[Auto-transcribed session — ${Math.round(duration_seconds / 60)} min]`;
  }
  await supabase.from("sessions").update(baseUpdate).eq("id", id);

  // Portrait regeneration — call lib directly (avoids internal HTTP auth issues)
  let portraitGenerated = false;

  if (transcriptQuality !== "none") {
    try {
      await generatePortrait(session.student_id, id);
      await supabase
        .from("sessions")
        .update({ portrait_status: "generated" })
        .eq("id", id);
      portraitGenerated = true;
    } catch (err) {
      console.error("[session/complete] Portrait generation error:", err);
      await supabase
        .from("sessions")
        .update({ portrait_status: "failed" })
        .eq("id", id);
    }
  } else {
    // No usable transcript — skip portrait, mark as no-op
    await supabase
      .from("sessions")
      .update({ portrait_status: "skipped" })
      .eq("id", id);
  }

  // Generate parent email draft (non-fatal if it fails)
  if (transcriptQuality !== "none") {
    try {
      const { data: student } = await supabase
        .from("students")
        .select("name, grade, development_stage")
        .eq("id", session.student_id)
        .single();

      const { data: latestPortrait } = await supabase
        .from("portraits")
        .select("content_json")
        .eq("student_id", session.student_id)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const userPrompt = `Student: ${student?.name ?? "the student"}, Grade ${student?.grade ?? "unknown"}
Session type: ${session.session_type}
Session duration: ~${Math.round(duration_seconds / 60)} minutes

${latestPortrait ? `Portrait notes:
Current growth edge: ${(latestPortrait.content_json as any).current_growth_edge ?? ""}
Next session focus: ${(latestPortrait.content_json as any).next_session_focus ?? ""}` : ""}

Transcript excerpt:
${transcript.slice(0, 1500)}

Write the parent update email body.`;

      const emailRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: PARENT_EMAIL_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.5,
          max_tokens: 250,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (emailRes.ok) {
        const completion = await emailRes.json();
        const draft = completion.choices?.[0]?.message?.content?.trim() ?? "";
        if (draft) {
          await supabase
            .from("sessions")
            .update({ parent_email_draft: draft })
            .eq("id", id);
        }
      }
    } catch (err) {
      console.error("[session/complete] Parent email draft failed:", err);
    }
  }

  return NextResponse.json({ ok: true, portrait_generated: portraitGenerated });
}

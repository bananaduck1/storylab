import { NextRequest, NextResponse } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getCallerTeacher } from "@/lib/teacher";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  void req; // no body needed
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teacher = await getCallerTeacher(user.id);
  if (!teacher) return NextResponse.json({ error: "Not a teacher" }, { status: 403 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 500 });

  // Fetch agent_config (getCallerTeacher already returns it, but fetch full record for name/subject)
  const { data: fullTeacher } = await getSupabase()
    .from("teachers")
    .select("agent_config, name, subject")
    .eq("id", teacher.id)
    .maybeSingle();

  const config = fullTeacher?.agent_config as Record<string, unknown> | null;
  const hasContent = config && (
    config.identity || config.core_beliefs || config.diagnostic_eye || config.voice
  );

  if (!hasContent) {
    return NextResponse.json(
      { error: "Complete your AI Agent profile first — the draft is generated from your identity and coaching philosophy." },
      { status: 400 }
    );
  }

  const configText = [
    config.identity && `Who I am: ${config.identity}`,
    config.core_beliefs && `What I believe: ${config.core_beliefs}`,
    config.diagnostic_eye && `What I notice: ${config.diagnostic_eye}`,
    config.voice && `My style: ${config.voice}`,
  ].filter(Boolean).join("\n\n");

  const systemPrompt = `You are helping a teacher write a short professional bio and a memorable quote for their tutoring storefront page.
Write in first person. Be specific and authentic — pull real details from their profile. Avoid generic coach-speak.
Return JSON with exactly two keys: "bio" (2-4 sentences, plain text) and "quote" (one memorable sentence, the teacher's philosophy in their own voice).`;

  const userPrompt = `Here is the teacher's profile:
Name: ${fullTeacher?.name ?? "the teacher"}
Subject: ${fullTeacher?.subject ?? "tutoring"}

${configText}

Write a bio and quote for their storefront page.`;

  let openaiRes: Response;
  try {
    const fetchPromise = fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 400,
      }),
    });

    openaiRes = await Promise.race([
      fetchPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 15000)
      ),
    ]);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "timeout") {
      return NextResponse.json({ error: "Draft generation timed out — try again." }, { status: 504 });
    }
    return NextResponse.json({ error: "Draft generation failed." }, { status: 500 });
  }

  if (!openaiRes.ok) {
    return NextResponse.json({ error: "Draft generation failed." }, { status: 500 });
  }

  const json = await openaiRes.json();
  const text = json.choices?.[0]?.message?.content ?? "{}";

  let parsed: { bio?: string; quote?: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Failed to parse draft response." }, { status: 500 });
  }

  return NextResponse.json({
    bio: parsed.bio ?? "",
    quote: parsed.quote ?? "",
  });
}

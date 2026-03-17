import { NextResponse } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";

// Cache TTL: 24 hours
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(): Promise<NextResponse> {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getSupabase();
  const { data: profile, error } = await db
    .from("student_profiles")
    .select("portrait_notes, strengths_notes, growth_notes, portrait_summary_updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // Return cached result if fresh enough
  if (
    profile.portrait_summary_updated_at &&
    Date.now() - new Date(profile.portrait_summary_updated_at).getTime() < CACHE_TTL_MS &&
    (profile.strengths_notes || profile.growth_notes)
  ) {
    return NextResponse.json({
      strengths_notes: profile.strengths_notes,
      growth_notes: profile.growth_notes,
    });
  }

  if (!profile.portrait_notes) {
    return NextResponse.json({
      strengths_notes: null,
      growth_notes: null,
    });
  }

  // Extract from portrait_notes using gpt-4o-mini
  let strengths_notes: string | null = null;
  let growth_notes: string | null = null;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 400,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a compassionate coach. Given internal notes about a student, extract two things in JSON: " +
              "(1) 2-4 bullet points of their genuine strengths as a thinker and writer, " +
              "(2) 2-3 bullet points of areas they're actively growing in. " +
              'Be warm and specific. Avoid generic praise. Respond with {"strengths":[...],"growth_areas":[...]}.',
          },
          {
            role: "user",
            content: `Internal coaching notes:\n\n${profile.portrait_notes}`,
          },
        ],
      }),
    });

    if (openaiRes.ok) {
      const json = await openaiRes.json();
      const content = json.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content);
      const strengths: string[] = parsed.strengths ?? [];
      const growthAreas: string[] = parsed.growth_areas ?? [];

      strengths_notes = strengths.length > 0 ? strengths.join("\n") : null;
      growth_notes = growthAreas.length > 0 ? growthAreas.join("\n") : null;
    }
  } catch (err) {
    console.error("[profile/refresh-portrait] extraction error", String(err));
    // Return cached if available, even if stale
    return NextResponse.json({
      strengths_notes: profile.strengths_notes,
      growth_notes: profile.growth_notes,
    });
  }

  // Persist updated summary
  await db
    .from("student_profiles")
    .update({
      strengths_notes,
      growth_notes,
      portrait_summary_updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  console.log("[profile/refresh-portrait] extracted", { userId: user.id });
  return NextResponse.json({ strengths_notes, growth_notes });
}

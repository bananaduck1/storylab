import { NextRequest, NextResponse } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import { VALID_GRADES, MAX_PROFILE_FIELD_LENGTH } from "@/lib/lab-constants";

export async function POST(req: NextRequest) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { full_name, grade, schools, essay_focus, writing_voice, goals,
          favorites_book, favorites_movie, favorites_song } = body;

  if (!full_name?.trim()) {
    return NextResponse.json({ error: "full_name is required" }, { status: 400 });
  }
  if (!grade?.trim()) {
    return NextResponse.json({ error: "grade is required" }, { status: 400 });
  }
  if (!VALID_GRADES.includes(grade.trim())) {
    return NextResponse.json({ error: "grade is invalid" }, { status: 400 });
  }
  for (const [field, value] of [
    ["schools", schools], ["essay_focus", essay_focus],
    ["writing_voice", writing_voice], ["goals", goals],
  ] as [string, string | undefined][]) {
    if (value && value.length > MAX_PROFILE_FIELD_LENGTH) {
      return NextResponse.json({ error: `${field} is too long (max ${MAX_PROFILE_FIELD_LENGTH} characters)` }, { status: 400 });
    }
  }

  const db = getSupabase();

  const { data, error } = await db
    .from("student_profiles")
    .upsert(
      {
        user_id: user.id,
        full_name: full_name.trim(),
        grade: grade.trim(),
        schools: schools?.trim() || null,
        essay_focus: essay_focus?.trim() || null,
        writing_voice: writing_voice?.trim() || null,
        goals: goals?.trim() || null,
        favorites_book: favorites_book?.trim() || null,
        favorites_movie: favorites_movie?.trim() || null,
        favorites_song: favorites_song?.trim() || null,
        onboarding_done: true,
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-link: if a students record exists with this email, link it (best-effort)
  if (user.email) {
    try {
      const { data: studentRow } = await db
        .from("students")
        .select("id, user_id")
        .eq("email", user.email)
        .is("user_id", null)
        .maybeSingle();

      if (studentRow) {
        await db.from("students").update({ user_id: user.id }).eq("id", studentRow.id);
        console.log("[onboarding/auto-link] linked", { userId: user.id, studentId: studentRow.id });
      }
    } catch (linkErr) {
      // Non-fatal — onboarding succeeds regardless
      console.error("[onboarding/auto-link] error (non-fatal)", String(linkErr));
    }
  }

  return NextResponse.json(data);
}

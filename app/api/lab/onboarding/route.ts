import { NextRequest, NextResponse } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { full_name, grade, schools, essay_focus, writing_voice, goals } = body;

  if (!full_name?.trim()) {
    return NextResponse.json({ error: "full_name is required" }, { status: 400 });
  }
  if (!grade?.trim()) {
    return NextResponse.json({ error: "grade is required" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
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
        onboarding_done: true,
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

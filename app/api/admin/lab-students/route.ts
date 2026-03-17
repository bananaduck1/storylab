import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Protected by middleware — only samahn240@gmail.com can reach /api/admin/*

export async function GET() {
  const db = getSupabase();

  // Fetch the 50 most recently active /lab students with their latest session phase.
  // Joins conversations to get the phase from the most recent conversation per user.
  const { data, error } = await db
    .from("student_profiles")
    .select(`
      user_id,
      full_name,
      grade,
      portrait_notes,
      updated_at,
      conversations (
        session_phase,
        updated_at
      )
    `)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten: pick the most recent conversation's session_phase per student
  const students = (data ?? []).map((row: any) => {
    const convs: Array<{ session_phase: string; updated_at: string }> = row.conversations ?? [];
    const latest = convs.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )[0];
    return {
      user_id: row.user_id,
      full_name: row.full_name,
      grade: row.grade,
      portrait_notes: row.portrait_notes,
      updated_at: row.updated_at,
      session_phase: latest?.session_phase ?? "opening",
    };
  });

  return NextResponse.json(students);
}

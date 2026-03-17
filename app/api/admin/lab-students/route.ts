import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Protected by middleware — only samahn240@gmail.com can reach /api/admin/*

export interface LabData {
  user_id: string;
  full_name: string;
  grade: string | null;
  portrait_notes: string | null;
  session_phase: string;
  lab_last_active: string;
}

export interface UnifiedStudent {
  // students table fields
  id: string;
  name: string;
  grade: string | null;
  email: string | null;
  user_id: string | null;
  development_stage: string;
  // lab data (null if not linked)
  lab: LabData | null;
}

export interface LabOnlyProfile {
  user_id: string;
  full_name: string;
  grade: string | null;
  portrait_notes: string | null;
  session_phase: string;
  lab_last_active: string;
}

export interface UnifiedResponse {
  students: UnifiedStudent[];
  labOnly: LabOnlyProfile[];
}

export async function GET(): Promise<NextResponse> {
  const db = getSupabase();

  // Fetch all students and all student_profiles in parallel
  const [{ data: students, error: studentsErr }, { data: profiles, error: profilesErr }] =
    await Promise.all([
      db.from("students").select("id, name, grade, email, user_id, development_stage").order("name"),
      db
        .from("student_profiles")
        .select("user_id, full_name, grade, portrait_notes, session_phase, updated_at")
        .order("updated_at", { ascending: false }),
    ]);

  if (studentsErr) return NextResponse.json({ error: studentsErr.message }, { status: 500 });
  if (profilesErr) return NextResponse.json({ error: profilesErr.message }, { status: 500 });

  // Build user_id → profile map
  const profileMap = new Map<string, LabData>(
    (profiles ?? []).map((p) => [
      p.user_id,
      {
        user_id: p.user_id,
        full_name: p.full_name,
        grade: p.grade,
        portrait_notes: p.portrait_notes,
        session_phase: p.session_phase ?? "opening",
        lab_last_active: p.updated_at,
      },
    ])
  );

  // Students with their lab data merged
  const unifiedStudents: UnifiedStudent[] = (students ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    grade: s.grade,
    email: s.email,
    user_id: s.user_id,
    development_stage: s.development_stage,
    lab: s.user_id ? (profileMap.get(s.user_id) ?? null) : null,
  }));

  // lab-only profiles: student_profiles whose user_id is not in any students.user_id
  const linkedUserIds = new Set(
    (students ?? []).map((s) => s.user_id).filter((id): id is string => !!id)
  );
  const labOnly: LabOnlyProfile[] = (profiles ?? [])
    .filter((p) => !linkedUserIds.has(p.user_id))
    .map((p) => ({
      user_id: p.user_id,
      full_name: p.full_name,
      grade: p.grade,
      portrait_notes: p.portrait_notes,
      session_phase: p.session_phase ?? "opening",
      lab_last_active: p.updated_at,
    }));

  return NextResponse.json({ students: unifiedStudents, labOnly });
}

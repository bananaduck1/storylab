// POST /api/teachers/[id]/waitlist
// Public endpoint — no auth required.
// Joins a prospective student to a teacher's waitlist.
// Idempotent: duplicate (teacher_id, student_email) returns 200, no new row.

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teacherId } = await params;

  const body = await req.json().catch(() => ({}));
  const email = (body.email as string)?.trim().toLowerCase();
  const name  = (body.name  as string)?.trim() || null;
  const note  = (body.note  as string)?.trim() || null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Verify teacher exists and is currently not accepting students
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, name, accepting_students")
    .eq("id", teacherId)
    .maybeSingle();

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  // Allow join even if teacher reopens (idempotent regardless)
  const { error } = await supabase
    .from("teacher_waitlist")
    .insert({
      teacher_id:    teacherId,
      student_email: email,
      student_name:  name,
      note,
    })
    .select("id")
    .single();

  // ON CONFLICT DO NOTHING via UNIQUE constraint — 23505 = unique_violation
  if (error && error.code !== "23505") {
    console.error("[waitlist] insert failed:", error);
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, teacher_name: teacher.name.split(" ")[0] });
}

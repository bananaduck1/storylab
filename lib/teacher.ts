import { getSupabase } from "@/lib/supabase";
import { getCallerUser } from "@/lib/lab-auth";

export interface TeacherRow {
  id: string;
  user_id: string;
  name: string;
  email: string;
  subject: string | null;
  agent_config: Record<string, unknown>;
}

/** Look up the teachers row for a given user_id. Returns null if not a teacher. */
export async function getCallerTeacher(userId?: string): Promise<TeacherRow | null> {
  let uid = userId;
  if (!uid) {
    const user = await getCallerUser();
    if (!user) return null;
    uid = user.id;
  }
  const { data } = await getSupabase()
    .from("teachers")
    .select("id, user_id, name, email, subject, agent_config")
    .eq("user_id", uid)
    .maybeSingle();
  return (data as TeacherRow | null) ?? null;
}

/**
 * Assert studentId belongs to teacherId.
 * Returns a 403 Response if not — caller should `return` the result.
 */
export async function verifyStudentOwnership(
  studentId: string,
  teacherId: string
): Promise<Response | null> {
  const { data } = await getSupabase()
    .from("students")
    .select("id")
    .eq("id", studentId)
    .eq("teacher_id", teacherId)
    .maybeSingle();
  if (!data) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

/** Get teacher email via session (for notifying teacher about student messages). */
export async function getTeacherEmailBySession(
  sessionId: string
): Promise<string | null> {
  const { data } = await getSupabase()
    .from("sessions")
    .select("teacher_id, teachers(email)")
    .eq("id", sessionId)
    .maybeSingle();
  return (data?.teachers as any)?.email ?? null;
}

/** Get student info via session (for notifying student about teacher replies). */
export async function getStudentBySession(sessionId: string): Promise<{
  email: string | null;
  name: string;
} | null> {
  const { data } = await getSupabase()
    .from("sessions")
    .select("student_id, students(name, email)")
    .eq("id", sessionId)
    .maybeSingle();
  if (!data) return null;
  const s = data.students as any;
  return { email: s?.email ?? null, name: s?.name ?? "Student" };
}

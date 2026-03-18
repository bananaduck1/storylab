import { redirect } from "next/navigation";
import { getCallerUser, ADMIN_EMAIL } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import TeacherDashboard from "./_components/TeacherDashboard";

export default async function DashboardPage() {
  const user = await getCallerUser();
  if (!user) redirect("/login");

  const db = getSupabase();
  const { data: teacher } = await db
    .from("teachers")
    .select("id, name, email, subject, agent_config")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!teacher) redirect("/teacher/register");

  const isFounder = user.email === ADMIN_EMAIL;

  const hasWizard =
    teacher.agent_config &&
    typeof teacher.agent_config === "object" &&
    Object.keys(teacher.agent_config).length > 0;

  const [{ data: students }, { data: recentSessions }, { data: studentProfile }] = await Promise.all([
    db
      .from("students")
      .select("id, name, grade, development_stage, email, invited_at, created_at")
      .eq("teacher_id", teacher.id)
      .order("name"),
    db
      .from("sessions")
      .select("id, student_id, date, session_type, status, scheduled_at")
      .eq("teacher_id", teacher.id)
      .order("created_at", { ascending: false })
      .limit(8),
    // Check if this teacher also has a student_profile (for lifelong learner banner).
    db.from("student_profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);

  // Attach student names to sessions
  const studentMap = new Map((students ?? []).map((s: any) => [s.id, s.name]));
  const sessionsWithNames = (recentSessions ?? []).map((s: any) => ({
    ...s,
    studentName: studentMap.get(s.student_id) ?? "Unknown",
  }));

  return (
    <TeacherDashboard
      teacher={teacher as any}
      students={(students ?? []) as any[]}
      recentSessions={sessionsWithNames}
      showWizardBanner={!hasWizard}
      showLearnerBanner={!studentProfile}
      isFounder={isFounder}
    />
  );
}

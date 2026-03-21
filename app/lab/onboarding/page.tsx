import { redirect } from "next/navigation";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import OnboardingClient from "./_components/OnboardingClient";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCallerUser();
  if (!user) redirect("/login");

  // Try to resolve the teacher assigned to this student (via the students table).
  // Falls back gracefully to "your coach" if no teacher is linked yet.
  let teacherName = "your coach";
  try {
    const db = getSupabase();
    const { data: studentRow } = await db
      .from("students")
      .select("teacher_id, teachers(name)")
      .eq("user_id", user.id)
      .maybeSingle();
    const teacher = studentRow?.teachers as { name: string } | null;
    if (teacher?.name) {
      teacherName = teacher.name.split(" ")[0];
    }
  } catch {
    // Silently fall back — missing teacher name is non-blocking
  }

  return <OnboardingClient teacherName={teacherName} />;
}

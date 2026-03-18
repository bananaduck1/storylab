import { redirect } from "next/navigation";
import { getCallerUser, getUserRole, getCallerStudentId } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import PreSessionBrief from "./_components/PreSessionBrief";
import VideoRoom from "./_components/VideoRoom";
import type { Portrait } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCallerUser();
  if (!user) redirect("/login");

  const supabase = getSupabase();
  const role = getUserRole(user);

  // Fetch session
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (!session || !session.daily_room_name) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500 text-sm">
        Session not found or video room not ready.
      </div>
    );
  }

  // Students may only join their own session
  if (role === "student") {
    const studentId = await getCallerStudentId(user.id);
    if (!studentId || studentId !== session.student_id) {
      return (
        <div className="flex min-h-screen items-center justify-center text-zinc-500 text-sm">
          You don&apos;t have access to this session.
        </div>
      );
    }
  }

  // For teacher: fetch student + portrait for pre-session brief
  let studentName = "";
  let portrait: Portrait | null = null;

  if (role === "teacher") {
    const [{ data: student }, { data: latestPortrait }] = await Promise.all([
      supabase.from("students").select("name, grade").eq("id", session.student_id).single(),
      supabase
        .from("portraits")
        .select("*")
        .eq("student_id", session.student_id)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    studentName = student?.name ?? "";
    portrait = latestPortrait as Portrait | null;
  }

  const isTeacher = role === "teacher";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      {isTeacher && (
        <PreSessionBrief
          sessionId={id}
          studentName={studentName}
          portrait={portrait}
          sessionType={session.session_type}
          scheduledAt={session.scheduled_at}
        />
      )}
      <VideoRoom
        sessionId={id}
        roomName={session.daily_room_name}
        isTeacher={isTeacher}
      />
    </div>
  );
}

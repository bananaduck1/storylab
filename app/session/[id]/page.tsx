import { redirect } from "next/navigation";
import { getCallerUser, getUserRole, getCallerStudentId } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import PreSessionBrief from "./_components/PreSessionBrief";
import PreSessionThread from "./_components/PreSessionThread";
import VideoRoom from "./_components/VideoRoom";
import ConsentGate from "./_components/ConsentGate";
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
  let studentHasConsented = false;
  if (role === "student") {
    const studentId = await getCallerStudentId(user.id);
    if (!studentId || studentId !== session.student_id) {
      return (
        <div className="flex min-h-screen items-center justify-center text-zinc-500 text-sm">
          You don&apos;t have access to this session.
        </div>
      );
    }

    // Check for prior consent so returning students skip the modal
    const { data: consentRow } = await supabase
      .from("session_consents")
      .select("id")
      .eq("session_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    studentHasConsented = !!consentRow;
  }

  // Fetch messages for thread (both roles)
  const { data: messages } = await supabase
    .from("session_messages")
    .select("id, sender_role, body, created_at")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  const threadMessages = messages ?? [];

  // Resolve teacher name for student-facing thread (non-blocking)
  let teacherName = "your coach";
  if (session.teacher_id) {
    const { data: teacher } = await supabase
      .from("teachers")
      .select("name")
      .eq("id", session.teacher_id)
      .maybeSingle();
    if (teacher?.name) teacherName = teacher.name.split(" ")[0];
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

  // Latest student message for pre-session brief
  const latestStudentMessage = threadMessages
    .filter((m) => m.sender_role === "student")
    .at(-1)?.body ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      {isTeacher ? (
        <PreSessionBrief
          sessionId={id}
          studentName={studentName}
          portrait={portrait}
          sessionType={session.session_type}
          scheduledAt={session.scheduled_at}
          latestStudentMessage={latestStudentMessage}
        />
      ) : (
        <PreSessionThread
          sessionId={id}
          initialMessages={threadMessages}
          teacherName={teacherName}
        />
      )}
      {/* Students see ConsentGate unless they've already consented this session */}
      {isTeacher || studentHasConsented ? (
        <VideoRoom
          sessionId={id}
          roomName={session.daily_room_name}
          isTeacher={isTeacher}
        />
      ) : (
        <ConsentGate
          sessionId={id}
          roomName={session.daily_room_name}
          teacherName={teacherName}
        />
      )}
    </div>
  );
}

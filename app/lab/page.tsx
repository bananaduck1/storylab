import { redirect } from "next/navigation";
import { getCallerUser, getUserRoles, ADMIN_EMAIL } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import { checkQuota } from "@/lib/lab-quota";
import LabChat from "./_components/LabChat";

export const dynamic = "force-dynamic";

export default async function LabPage(props: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const user = await getCallerUser();
  if (!user) redirect("/login");

  const searchParams = await props.searchParams;
  const successParam = typeof searchParams.success === "string" ? searchParams.success : null;
  const successType =
    successParam === "subscription" || successParam === "topup" ? successParam : null;

  const db = getSupabase();

  // DB-based role resolution — supports multi-role users (teacher + student simultaneously).
  // isTeacher/isStudent are derived from DB rows, not user_metadata.
  const roles = await getUserRoles(user.id);
  const isFounder = user.email === ADMIN_EMAIL;
  const { isTeacher, isStudent } = roles;

  // Fetch profile + conversations in parallel, then checkQuota reuses the profile row.
  // Always check for linked students record (any role may have one).
  const [{ data: profile }, { data: conversations }, linkedStudentRow] = await Promise.all([
    db.from("student_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    db
      .from("conversations")
      .select("id, title, updated_at, essay_mode")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50),
    db.from("students").select("id").eq("user_id", user.id).maybeSingle().then((r) => r.data),
  ]);

  // Upcoming video sessions for linked students
  let upcomingSession: { id: string; scheduled_at: string } | null = null;
  if (isStudent && linkedStudentRow?.id) {
    const { data: nextSession } = await db
      .from("sessions")
      .select("id, scheduled_at")
      .eq("student_id", linkedStudentRow.id)
      .in("status", ["scheduled", "in_progress"])
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    upcomingSession = nextSession ?? null;
  }
  const quota = await checkQuota(user.id, profile);

  // isLinked: true if this user has a linked students record (or is a teacher/founder with no student record)
  const isLinked = isStudent ? !!linkedStudentRow : true;

  // Teachers bypass the onboarding redirect — they see LabChat with the learner banner instead.
  if (!isTeacher && (!profile || !profile.onboarding_done)) {
    redirect("/lab/onboarding");
  }

  const convList = conversations ?? [];

  // Ensure at least one conversation exists
  let activeConvId: string;
  let initialMessages: Array<{
    id: string;
    role: string;
    content: string;
    file_name: string | null;
    created_at: string;
  }> = [];

  if (convList.length === 0) {
    const { data: newConv } = await db
      .from("conversations")
      .insert({ user_id: user.id, title: "New conversation" })
      .select()
      .single();
    activeConvId = newConv!.id;
    convList.unshift({
      id: activeConvId,
      title: "New conversation",
      updated_at: new Date().toISOString(),
      essay_mode: "common_app",
    });
  } else {
    activeConvId = convList[0].id;
    const { data: msgs } = await db
      .from("conversation_messages")
      .select("id, role, content, file_name, created_at")
      .eq("conversation_id", activeConvId)
      .order("created_at", { ascending: true })
      .limit(100);
    initialMessages = msgs ?? [];
  }

  const quotaState = quota ?? {
    plan: "free" as const,
    remaining: 0,
    limit: 50,
    extraMessages: 0,
    debitType: "daily" as const,
  };

  return (
    <>
      {upcomingSession && (
        <UpcomingSessionBanner session={upcomingSession} />
      )}
      <LabChat
        profile={profile}
        conversations={convList}
        activeConversationId={activeConvId}
        initialMessages={initialMessages}
        quota={quotaState}
        successType={successType}
        isLinked={isLinked}
        isTeacher={isTeacher}
        isFounder={isFounder}
        showTeacherLearnerBanner={isTeacher && (!profile || !profile.onboarding_done)}
      />
    </>
  );
}

function UpcomingSessionBanner({
  session,
}: {
  session: { id: string; scheduled_at: string };
}) {
  const sessionDate = new Date(session.scheduled_at);
  const now = new Date();
  const minutesUntil = Math.round((sessionDate.getTime() - now.getTime()) / 60000);
  const isNow = minutesUntil <= 10 && minutesUntil > -60;

  const timeLabel = isNow
    ? "Your session is starting now"
    : `Your session starts ${sessionDate.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}`;

  return (
    <div className={`flex items-center justify-between px-4 py-3 text-sm ${
      isNow
        ? "bg-emerald-950 border-b border-emerald-800 text-emerald-200"
        : "bg-zinc-900 border-b border-zinc-800 text-zinc-300"
    }`}>
      <span>{timeLabel}</span>
      <a
        href={`/session/${session.id}`}
        className={`rounded px-3 py-1.5 text-xs font-medium ${
          isNow
            ? "bg-emerald-700 text-white hover:bg-emerald-600"
            : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
        }`}
      >
        {isNow ? "Join now →" : "View session →"}
      </a>
    </div>
  );
}

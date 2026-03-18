import { redirect } from "next/navigation";
import { getCallerUser } from "@/lib/lab-auth";
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

  const isStudent = user.user_metadata?.role === "student";

  // Fetch profile + conversations in parallel, then checkQuota reuses the profile row.
  // For student-role users, also check if they have a linked students record.
  const [{ data: profile }, { data: conversations }, linkedStudentRow] = await Promise.all([
    db.from("student_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    db
      .from("conversations")
      .select("id, title, updated_at, essay_mode")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50),
    isStudent
      ? db.from("students").select("id").eq("user_id", user.id).maybeSingle().then((r) => r.data)
      : Promise.resolve(null),
  ]);
  const quota = await checkQuota(user.id, profile);

  // isLinked: true if this student-role user has a linked students record
  const isLinked = isStudent ? !!linkedStudentRow : true;

  if (!profile || !profile.onboarding_done) {
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
    <LabChat
      profile={profile}
      conversations={convList}
      activeConversationId={activeConvId}
      initialMessages={initialMessages}
      quota={quotaState}
      successType={successType}
      isLinked={isLinked}
    />
  );
}

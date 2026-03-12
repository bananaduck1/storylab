import { redirect } from "next/navigation";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import LabChat from "./_components/LabChat";

export const dynamic = "force-dynamic";

export default async function LabPage() {
  const user = await getCallerUser();
  if (!user) redirect("/login");

  const db = getSupabase();

  // Profile check — redirect to onboarding if missing
  const { data: profile } = await db
    .from("student_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || !profile.onboarding_done) {
    redirect("/lab/onboarding");
  }

  // Fetch conversations
  const { data: conversations } = await db
    .from("conversations")
    .select("id, title, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  const convList = conversations ?? [];

  // Ensure at least one conversation exists
  let activeConvId: string;
  let initialMessages: Array<{ id: string; role: string; content: string; file_name: string | null; created_at: string }> = [];

  if (convList.length === 0) {
    const { data: newConv } = await db
      .from("conversations")
      .insert({ user_id: user.id, title: "New conversation" })
      .select()
      .single();
    activeConvId = newConv!.id;
    convList.unshift({ id: activeConvId, title: "New conversation", updated_at: new Date().toISOString() });
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

  // Daily quota
  const today = new Date().toISOString().split("T")[0];
  const { count: usedToday } = await db
    .from("usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("day", today);

  const dailyLimit = parseInt(process.env.LAB_DAILY_LIMIT ?? "50");

  return (
    <LabChat
      userId={user.id}
      profile={profile}
      conversations={convList}
      activeConversationId={activeConvId}
      initialMessages={initialMessages}
      dailyUsed={usedToday ?? 0}
      dailyLimit={dailyLimit}
    />
  );
}

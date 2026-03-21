import { redirect } from "next/navigation";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import ProfileForm from "../_components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCallerUser();
  if (!user) redirect("/login");

  const db = getSupabase();

  // Fetch profile and conversation IDs in parallel
  const [{ data: profile }, { data: convRows }] = await Promise.all([
    db.from("student_profiles").select("*, teachers(name)").eq("user_id", user.id).maybeSingle(),
    db.from("conversations").select("id").eq("user_id", user.id),
  ]);

  const teacherRow = profile?.teachers as { name: string } | null;
  const teacherName = teacherRow?.name?.split(" ")[0] ?? "your coach";

  if (!profile || !profile.onboarding_done) {
    redirect("/lab/onboarding");
  }

  const convCount = convRows?.length ?? 0;

  // Count messages across all conversations
  let msgCount = 0;
  if (convRows && convRows.length > 0) {
    const { count } = await db
      .from("conversation_messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", convRows.map((c) => c.id));
    msgCount = count ?? 0;
  }

  return (
    <ProfileForm
      profile={profile}
      stats={{
        convCount,
        msgCount,
        email: user.email ?? "",
      }}
      teacherName={teacherName}
    />
  );
}

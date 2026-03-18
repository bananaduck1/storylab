import { redirect } from "next/navigation";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import SettingsClient from "./_components/SettingsClient";

export default async function SettingsPage() {
  const user = await getCallerUser();
  if (!user) redirect("/login");

  const { data: teacher } = await getSupabase()
    .from("teachers")
    .select("id, name, email, subject, agent_config")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!teacher) redirect("/teacher/register");

  return <SettingsClient teacher={teacher as any} />;
}

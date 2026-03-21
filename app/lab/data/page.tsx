// /lab/data — Student Data Rights Center
//
// Design decisions (CEO plan 2026-03-21):
// • "Your StoryLab data" framing — warm, student-owned
// • Summary stats card first (conversations, messages, joined date)
// • Export + recordings toggle above fold (primary controls)
// • Expandable conversation list below
// • Student-facing data only: strengths_notes, growth_notes
//   NEVER includes portraits.content_json (teacher-only clinical assessment)
// • Linked from /lab/profile footer only (not main nav)

import { redirect } from "next/navigation";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import DataRightsClient from "./_components/DataRightsClient";

export const dynamic = "force-dynamic";

export default async function DataPage() {
  const user = await getCallerUser();
  if (!user) redirect("/login");

  const db = getSupabase();

  // Fetch profile (student-facing fields only — NOT portraits.content_json)
  const { data: profile } = await db
    .from("student_profiles")
    .select(
      "full_name, grade, schools, essay_focus, strengths_notes, growth_notes, " +
      "recordings_consent, created_at"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/lab/onboarding");

  // Non-deleted conversations with message counts
  const { data: conversations } = await db
    .from("conversations")
    .select("id, title, essay_mode, created_at, updated_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const convs = conversations ?? [];

  // Total message count
  let totalMessages = 0;
  if (convs.length > 0) {
    const { count } = await db
      .from("conversation_messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", convs.map((c) => c.id));
    totalMessages = count ?? 0;
  }

  return (
    <DataRightsClient
      profile={profile as any}
      conversations={convs}
      totalMessages={totalMessages}
      userEmail={user.email ?? ""}
    />
  );
}

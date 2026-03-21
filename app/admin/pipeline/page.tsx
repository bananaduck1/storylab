// /admin/pipeline — B2B pipeline table
//
// Design decisions (CEO plan 2026-03-21):
// • Table layout (not kanban)
// • Dark green #2C4A3E header row, Cooper font throughout
// • Stage badges as pills (rounded-full) with color by stage
// • 60-day inactivity shows amber ⚠️ (not red)
// • last_contacted_at = null → no alert (not treated as ancient date)
// • Inline stage dropdown PATCH saves immediately

import { redirect } from "next/navigation";
import { getCallerUser, ADMIN_EMAIL } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import PipelineClient from "./_components/PipelineClient";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const user = await getCallerUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/login");

  const { data: orgs } = await getSupabase()
    .from("organizations")
    .select(
      `id, name, slug, contact_email, pipeline_stage, pipeline_notes,
       last_contacted_at, pricing_tier, deal_notes, created_at,
       org_subscriptions(status, current_period_end)`
    )
    .order("created_at", { ascending: false });

  return <PipelineClient initialOrgs={(orgs ?? []) as any} />;
}

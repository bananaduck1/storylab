import { redirect } from "next/navigation";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import { computeCompleteness } from "@/lib/teacher-completeness";
import type { StorefrontContent } from "@/lib/types/storefront";
import SettingsClient from "./_components/SettingsClient";

export default async function SettingsPage() {
  const user = await getCallerUser();
  if (!user) redirect("/login");

  const { data: teacher } = await getSupabase()
    .from("teachers")
    .select("id, name, email, subject, agent_config, bio, photo_url, quote, pricing_config, ai_coaching_enabled, live_sessions_enabled, primary_emphasis, storefront_content, storefront_published, stripe_account_id, stripe_onboarding_complete")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!teacher) redirect("/teacher/register");

  const completeness = computeCompleteness({
    photo_url: teacher.photo_url ?? null,
    bio: teacher.bio ?? null,
    quote: teacher.quote ?? null,
    subject: teacher.subject ?? null,
    pricing_config: teacher.pricing_config ?? null,
    storefront_content: (teacher.storefront_content as StorefrontContent | null) ?? null,
    ai_coaching_enabled: teacher.ai_coaching_enabled ?? false,
    live_sessions_enabled: teacher.live_sessions_enabled ?? false,
  });

  return <SettingsClient teacher={teacher as any} completeness={completeness} />;
}

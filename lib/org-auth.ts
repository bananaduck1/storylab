import { getSupabase } from "@/lib/supabase";

export interface OrgWithSubscription {
  id: string;
  slug: string;
  name: string;
  invite_code: string;
  email_domain: string | null;
  ai_context: string | null;
  logo_url: string | null;
  primary_color: string | null;
  subscription_status: string;
}

/** Returns true if the given userId is an admin of the given org (by slug) */
export async function isOrgAdmin(userId: string, orgSlug: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("org_teachers")
    .select("role, teachers!inner(user_id), organizations!inner(slug)")
    .eq("teachers.user_id", userId)
    .eq("organizations.slug", orgSlug)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

/** Returns the org + subscription status, or null if not found */
export async function getOrgWithStatus(orgSlug: string): Promise<OrgWithSubscription | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("organizations")
    .select(`
      id, slug, name, invite_code, email_domain, ai_context, logo_url, primary_color,
      org_subscriptions(status)
    `)
    .eq("slug", orgSlug)
    .maybeSingle();
  if (!data) return null;
  const sub = Array.isArray(data.org_subscriptions) ? data.org_subscriptions[0] : data.org_subscriptions;
  return {
    ...data,
    subscription_status: (sub as any)?.status ?? "inactive",
  };
}

/** Returns true if user is an active member (teacher or student) of the org */
export async function isOrgMember(userId: string, orgSlug: string): Promise<boolean> {
  const supabase = getSupabase();
  // Check teachers
  const { data: teacherRow } = await supabase
    .from("org_teachers")
    .select("id, teachers!inner(user_id), organizations!inner(slug)")
    .eq("teachers.user_id", userId)
    .eq("organizations.slug", orgSlug)
    .maybeSingle();
  if (teacherRow) return true;
  // Check students
  const { data: studentRow } = await supabase
    .from("students")
    .select("id, organizations!inner(slug)")
    .eq("user_id", userId)
    .eq("org_membership_status", "active")
    .eq("organizations.slug", orgSlug)
    .maybeSingle();
  return !!studentRow;
}

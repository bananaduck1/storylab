import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isOrgAdmin } from "@/lib/org-auth";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await isOrgAdmin(user.id, slug);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getSupabase();
  const { data: org } = await db.from("organizations").select("id").eq("slug", slug).maybeSingle();
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Get all student IDs in this org
  const { data: students } = await db
    .from("students")
    .select("id, name, org_membership_status, created_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  const studentIds = (students ?? []).filter(s => s.org_membership_status === "active").map(s => s.id);

  // Count sessions in last 30 days
  const { count: sessionCount } = await db
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .in("student_id", studentIds.length > 0 ? studentIds : ["none"])
    .gte("created_at", thirtyDaysAgo);

  // Count lab messages in last 30 days
  const { count: labMessageCount } = await db
    .from("usage_logs")
    .select("id", { count: "exact", head: true })
    .in("student_id", studentIds.length > 0 ? studentIds : ["none"])
    .gte("created_at", thirtyDaysAgo);

  // Last active per student (from usage_logs)
  const { data: recentUsage } = await db
    .from("usage_logs")
    .select("student_id, created_at")
    .in("student_id", studentIds.length > 0 ? studentIds : ["none"])
    .order("created_at", { ascending: false });

  const lastActiveByStudent: Record<string, string> = {};
  for (const row of recentUsage ?? []) {
    if (!lastActiveByStudent[row.student_id]) {
      lastActiveByStudent[row.student_id] = row.created_at;
    }
  }

  const studentsWithActivity = (students ?? []).map(s => ({
    ...s,
    last_active: lastActiveByStudent[s.id] ?? null,
  }));

  return NextResponse.json({
    student_count: studentIds.length,
    session_count_30d: sessionCount ?? 0,
    lab_messages_30d: labMessageCount ?? 0,
    students: studentsWithActivity,
  });
}

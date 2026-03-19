import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isOrgAdmin } from "@/lib/org-auth";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
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

  const { teacher_id } = await request.json();
  if (!teacher_id) return NextResponse.json({ error: "teacher_id required" }, { status: 400 });

  const db = getSupabase();
  const { data: org } = await db.from("organizations").select("id, name, invite_code").eq("slug", slug).maybeSingle();
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: teacher } = await db.from("teachers").select("id, email, name").eq("id", teacher_id).maybeSingle();
  if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

  // Check not already a member
  const { data: existing } = await db.from("org_teachers").select("id").eq("org_id", org.id).eq("teacher_id", teacher_id).maybeSingle();
  if (existing) return NextResponse.json({ message: "Teacher is already a member" }, { status: 200 });

  // Return the invite URL so the admin can share it
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const joinUrl = `${SITE_URL}/org/${slug}/join?code=${org.invite_code}`;

  return NextResponse.json({
    invite_url: joinUrl,
    message: `Share this link with ${(teacher as any).name} to invite them to ${(org as any).name}`,
  });
}

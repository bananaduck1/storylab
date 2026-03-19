import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isOrgAdmin } from "@/lib/org-auth";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await isOrgAdmin(user.id, slug);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getSupabase();
  const { data: org } = await db.from("organizations").select("id").eq("slug", slug).maybeSingle();
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [{ data: teachers }, { data: students }] = await Promise.all([
    db.from("org_teachers").select("id, role, joined_at, teachers(id, name, email, slug)").eq("org_id", org.id),
    db.from("students").select("id, name, org_membership_status, created_at").eq("org_id", org.id),
  ]);

  return NextResponse.json({ teachers: teachers ?? [], students: students ?? [] });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await isOrgAdmin(user.id, slug);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { student_id, action } = await request.json(); // action: 'approve' | 'reject'
  if (!student_id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "student_id and action (approve|reject) required" }, { status: 400 });
  }

  const db = getSupabase();
  if (action === "approve") {
    await db.from("students").update({ org_membership_status: "active" }).eq("id", student_id);
  } else {
    await db.from("students").update({ org_id: null, org_membership_status: null }).eq("id", student_id);
  }
  return NextResponse.json({ ok: true });
}

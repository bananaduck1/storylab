import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
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

  const { invite_code } = await request.json();
  const db = getSupabase();

  const { data: org } = await db.from("organizations").select("id, invite_code").eq("slug", slug).maybeSingle();
  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });
  if (org.invite_code !== invite_code) return NextResponse.json({ error: "Invalid invite code" }, { status: 403 });

  // Check if user is a teacher
  const { data: teacher } = await db.from("teachers").select("id").eq("user_id", user.id).maybeSingle();
  if (teacher) {
    // Idempotent insert
    const { error } = await db.from("org_teachers").upsert(
      { org_id: org.id, teacher_id: teacher.id, role: "member" },
      { onConflict: "org_id,teacher_id", ignoreDuplicates: true }
    );
    if (error) return NextResponse.json({ error: "Failed to join" }, { status: 500 });
    return NextResponse.json({ joined: true, role: "teacher" });
  }

  // Check if user is a student
  const { data: student } = await db.from("students").select("id, org_id").eq("user_id", user.id).maybeSingle();
  if (student) {
    if (student.org_id === org.id) return NextResponse.json({ joined: true, role: "student" }); // already in
    await db.from("students").update({ org_id: org.id, org_membership_status: "active" }).eq("id", student.id);
    return NextResponse.json({ joined: true, role: "student" });
  }

  return NextResponse.json({ error: "No teacher or student profile found" }, { status: 400 });
}

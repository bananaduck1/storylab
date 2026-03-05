import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getCallerUser, getUserRole } from "@/lib/lab-auth";

export async function GET(req: NextRequest) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = getUserRole(user);
  const self = new URL(req.url).searchParams.get("self");

  if (role === "student" || self) {
    // Return only the student row linked to this user
    const { data, error } = await getSupabase()
      .from("students")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Teacher — return all
  const { data, error } = await getSupabase()
    .from("students")
    .select("*")
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (getUserRole(user) !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    name,
    age,
    grade,
    start_date,
    cultural_background,
    family_language_pref,
    development_stage,
    seed_notes,
  } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("students")
    .insert({
      name,
      age: age || null,
      grade: grade || null,
      start_date: start_date || null,
      cultural_background: cultural_background || null,
      family_language_pref: family_language_pref || null,
      development_stage: development_stage || "exploration",
      seed_notes: seed_notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

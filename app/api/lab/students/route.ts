import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await getSupabase()
    .from("students")
    .select("*")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
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

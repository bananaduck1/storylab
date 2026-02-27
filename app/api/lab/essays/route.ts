import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("student_id");

  if (!studentId) {
    return NextResponse.json({ error: "student_id required" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("essays")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { student_id, title, prompt, drafts, pattern_notes } = body;

  if (!student_id) {
    return NextResponse.json({ error: "student_id required" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("essays")
    .insert({
      student_id,
      title: title || null,
      prompt: prompt || null,
      drafts: drafts || [],
      pattern_notes: pattern_notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

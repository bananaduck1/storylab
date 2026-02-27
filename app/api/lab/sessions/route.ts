import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("student_id");

  if (!studentId) {
    return NextResponse.json({ error: "student_id required" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("sessions")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { student_id, date, session_type, raw_notes, key_observations } = body;

  if (!student_id || !session_type) {
    return NextResponse.json(
      { error: "student_id and session_type are required" },
      { status: 400 }
    );
  }

  const { data, error } = await getSupabase()
    .from("sessions")
    .insert({
      student_id,
      date: date || new Date().toISOString().split("T")[0],
      session_type,
      raw_notes: raw_notes || null,
      key_observations: key_observations || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

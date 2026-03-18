// Teacher availability API — teacher-scoped slot management
// GET  — fetch this teacher's slots
// POST — add a slot for this teacher
// PATCH — toggle is_booked
// DELETE — remove an unbooked slot

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getCallerUser } from "@/lib/lab-auth";
import { getCallerTeacher } from "@/lib/teacher";

async function getTeacher() {
  const user = await getCallerUser();
  if (!user) return null;
  return getCallerTeacher(user.id);
}

export async function GET() {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("availability")
    .select("id, offering_type, datetime, is_booked, created_at")
    .eq("teacher_id", teacher.id)
    .order("datetime", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slots: data });
}

export async function POST(req: NextRequest) {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { datetime?: string; offering_type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { datetime, offering_type = "consultation" } = body;
  if (!datetime) return NextResponse.json({ error: "datetime is required" }, { status: 400 });

  if (new Date(datetime) <= new Date()) {
    return NextResponse.json({ error: "Slot must be in the future" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("availability")
    .insert({ datetime, offering_type, is_booked: false, teacher_id: teacher.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slot: data });
}

export async function PATCH(req: NextRequest) {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { id?: string; is_booked?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, is_booked } = body;
  if (!id || is_booked === undefined) {
    return NextResponse.json({ error: "id and is_booked are required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("availability")
    .update({ is_booked })
    .eq("id", id)
    .eq("teacher_id", teacher.id); // scope to this teacher

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const teacher = await getTeacher();
  if (!teacher) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const supabase = getSupabase();
  // Only allow deleting unbooked slots
  const { error } = await supabase
    .from("availability")
    .delete()
    .eq("id", id)
    .eq("teacher_id", teacher.id)
    .eq("is_booked", false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

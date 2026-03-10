import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// All routes here are protected by middleware (admin-only)

// GET — fetch all slots (admin sees all, including booked and past)
export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("availability")
    .select("id, offering_type, datetime, is_booked, created_at")
    .order("datetime", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slots: data });
}

// POST — add a new slot
export async function POST(req: NextRequest) {
  let body: { datetime?: string; offering_type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { datetime, offering_type } = body;

  if (!datetime || !offering_type) {
    return NextResponse.json({ error: "datetime and offering_type are required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("availability")
    .insert({ datetime, offering_type, is_booked: false })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slot: data });
}

// PATCH — toggle is_booked on a slot
export async function PATCH(req: NextRequest) {
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
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE — remove a slot
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase.from("availability").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

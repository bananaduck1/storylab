import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const offeringType = searchParams.get("offering_type") ?? "consultation";
  const teacherId = searchParams.get("teacher_id");

  const supabase = getSupabase();
  let query = supabase
    .from("availability")
    .select("id, datetime, offering_type")
    .eq("offering_type", offeringType)
    .eq("is_booked", false)
    .gte("datetime", new Date().toISOString())
    .order("datetime", { ascending: true });

  if (teacherId) {
    query = query.eq("teacher_id", teacherId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slots: data });
}

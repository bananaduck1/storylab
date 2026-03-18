// POST /api/session/[id]/flag
// Admin-only. Saves a flagged transcript quote to the session's flagged_moments array.

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getCallerUser, getUserRole } from "@/lib/lab-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (getUserRole(user) !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { quote, timestamp_ms } = body as { quote: string; timestamp_ms: number };

  if (!quote || !quote.trim()) {
    return NextResponse.json({ error: "quote is required" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Fetch existing flagged_moments to deduplicate
  const { data: session } = await supabase
    .from("sessions")
    .select("flagged_moments")
    .eq("id", id)
    .single();

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const existing: Array<{ quote: string; timestamp_ms: number; flagged_at: string }> =
    session.flagged_moments ?? [];

  // Deduplicate: skip if a flag with the same timestamp (±2s) already exists
  const isDuplicate = existing.some(
    (m) => Math.abs(m.timestamp_ms - (timestamp_ms ?? 0)) < 2000
  );

  if (isDuplicate) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const newMoment = {
    quote: quote.trim(),
    timestamp_ms: timestamp_ms ?? 0,
    flagged_at: new Date().toISOString(),
  };

  await supabase
    .from("sessions")
    .update({ flagged_moments: [...existing, newMoment] })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}

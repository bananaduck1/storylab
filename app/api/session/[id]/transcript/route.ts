// POST /api/session/[id]/transcript
// Any session participant (teacher or student) streams their speech chunks here
// as Web Speech API produces them. Speaker label is derived from auth — never trusted from client.
// On session complete, chunks are merged by timestamp into a full dialogue.

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getCallerUser, getUserRole, getCallerStudentId } from "@/lib/lab-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { text, timestamp_ms } = body as { text: string; timestamp_ms: number };

  if (!text || !text.trim()) {
    return NextResponse.json({ ok: true }); // empty chunk, silently ignore
  }

  const supabase = getSupabase();
  const role = getUserRole(user);

  // Verify the caller is a participant in this session
  if (role !== "teacher") {
    const studentId = await getCallerStudentId(user.id);
    const { data: session } = await supabase
      .from("sessions")
      .select("student_id")
      .eq("id", id)
      .single();
    if (!session || !studentId || session.student_id !== studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Speaker is derived from auth, never from client body
  const speaker = role === "teacher" ? "teacher" : "student";

  await supabase.from("transcript_chunks").insert({
    session_id: id,
    speaker,
    text: text.trim(),
    timestamp_ms: timestamp_ms ?? Date.now(),
  });

  return NextResponse.json({ ok: true });
}

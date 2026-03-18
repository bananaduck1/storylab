// GET /api/session/[id]/token
// Issues a Daily.co meeting token for the authenticated user.
// Teachers (admin) get is_owner:true. Students get is_owner:false,
// but only if the session belongs to their student record.

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getCallerUser, getUserRole, getCallerStudentId } from "@/lib/lab-auth";
import { createMeetingToken } from "@/lib/daily";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const { data: session, error } = await supabase
    .from("sessions")
    .select("id, student_id, daily_room_name, status")
    .eq("id", id)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!session.daily_room_name) {
    return NextResponse.json({ error: "Video room not yet created" }, { status: 409 });
  }

  const role = getUserRole(user);
  let isOwner = false;

  if (role === "teacher") {
    isOwner = true;
  } else {
    // Student: verify this session belongs to them
    const studentId = await getCallerStudentId(user.id);
    if (!studentId || studentId !== session.student_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    isOwner = false;
  }

  // Mark session as in_progress when someone joins (idempotent)
  if (session.status === "scheduled") {
    await supabase
      .from("sessions")
      .update({ status: "in_progress" })
      .eq("id", id);
  }

  const userName = role === "teacher" ? "Sam" : "Student";

  try {
    const { token } = await createMeetingToken(
      session.daily_room_name,
      userName,
      isOwner
    );
    return NextResponse.json({ token, room_name: session.daily_room_name });
  } catch (err) {
    console.error("[session/token] createMeetingToken failed:", err);
    return NextResponse.json({ error: "Failed to create meeting token" }, { status: 500 });
  }
}

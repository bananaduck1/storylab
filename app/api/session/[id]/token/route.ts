// GET /api/session/[id]/token
// Issues a Daily.co meeting token for the authenticated user.
// Teachers (admin) get is_owner:true. Students get is_owner:false,
// but only if the session belongs to their student record.
//
// Self-heal: if the Daily.co room has expired or was deleted, this route
// recreates it and updates the DB before issuing the token.

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getCallerUser, getUserRole, getCallerStudentId } from "@/lib/lab-auth";
import { createMeetingToken, createDailyRoom } from "@/lib/daily";

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
    .select("id, student_id, daily_room_name, scheduled_at, status, teacher_id, teachers(name)")
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

    // ── Server-side consent enforcement ───────────────────────────────────
    // The client modal is UX — this is the actual gate.

    // 1. Check recordings_consent — student may have withdrawn via Data Rights Center
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("recordings_consent")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile && profile.recordings_consent === false) {
      return NextResponse.json(
        { error: "consent required", reason: "recordings_consent_withdrawn" },
        { status: 403 }
      );
    }

    // 2. Check session-specific consent row
    const { data: consentRow } = await supabase
      .from("session_consents")
      .select("id")
      .eq("session_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!consentRow) {
      return NextResponse.json(
        { error: "consent required", reason: "no_session_consent" },
        { status: 403 }
      );
    }
  }

  // Mark session as in_progress when someone joins (idempotent)
  if (session.status === "scheduled") {
    await supabase
      .from("sessions")
      .update({ status: "in_progress" })
      .eq("id", id);
  }

  const sessionTeacher = (session as any).teachers as { name: string } | null;
  const teacherDisplayName = sessionTeacher?.name?.split(" ")[0] ?? "Coach";
  const userName = role === "teacher" ? teacherDisplayName : "Student";
  const scheduledAt = session.scheduled_at ? new Date(session.scheduled_at) : undefined;

  let roomName = session.daily_room_name;

  try {
    const { token } = await createMeetingToken(roomName, userName, isOwner, scheduledAt);
    return NextResponse.json({ token, room_name: roomName });
  } catch (err: any) {
    const errText = String(err?.message ?? err);

    // Self-heal: if the room expired or was deleted, recreate it and retry once.
    if (errText.includes("room not found") || errText.includes("does not exist")) {
      console.warn(`[session/token] Room "${roomName}" not found — recreating.`);
      try {
        const newRoom = await createDailyRoom(roomName, scheduledAt);
        // Update the DB with the (potentially new) room url
        await supabase
          .from("sessions")
          .update({ daily_room_name: newRoom.name, daily_room_url: newRoom.url })
          .eq("id", id);
        roomName = newRoom.name;
        const { token } = await createMeetingToken(roomName, userName, isOwner, scheduledAt);
        return NextResponse.json({ token, room_name: roomName });
      } catch (healErr) {
        console.error("[session/token] Self-heal failed:", healErr);
        return NextResponse.json({ error: "Failed to recreate video room" }, { status: 500 });
      }
    }

    console.error("[session/token] createMeetingToken failed:", err);
    return NextResponse.json({ error: "Failed to create meeting token" }, { status: 500 });
  }
}

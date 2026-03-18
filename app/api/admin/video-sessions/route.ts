// POST /api/admin/video-sessions
// Teacher schedules a video session for a student.
// Creates a Daily.co room, saves a sessions row (status: scheduled),
// and emails the student their join link.

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getCallerUser, getUserRole } from "@/lib/lab-auth";
import { createDailyRoom } from "@/lib/daily";
import { Resend } from "resend";
import type { SessionType } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (getUserRole(user) !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { student_id, scheduled_at, session_type } = body as {
    student_id: string;
    scheduled_at: string; // ISO 8601
    session_type: SessionType;
  };

  if (!student_id || !scheduled_at || !session_type) {
    return NextResponse.json(
      { error: "student_id, scheduled_at, and session_type are required" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // Fetch student for email + name
  const { data: student, error: studentErr } = await supabase
    .from("students")
    .select("id, name, email")
    .eq("id", student_id)
    .single();

  if (studentErr || !student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Create Daily.co room named after the session UUID we're about to create.
  // Use a temp name first, then update — or insert first and use the UUID.
  // Strategy: insert session row first (without room fields), get UUID, create room.
  const { data: session, error: insertErr } = await supabase
    .from("sessions")
    .insert({
      student_id,
      date: new Date(scheduled_at).toISOString().split("T")[0],
      scheduled_at,
      session_type,
      status: "scheduled",
    })
    .select()
    .single();

  if (insertErr || !session) {
    return NextResponse.json(
      { error: insertErr?.message ?? "Failed to create session" },
      { status: 500 }
    );
  }

  // Create Daily.co room using session UUID as room name
  let roomName: string;
  let roomUrl: string;
  try {
    const room = await createDailyRoom(session.id, new Date(scheduled_at));
    roomName = room.name;
    roomUrl = room.url;
  } catch (err) {
    // Room creation failed — update session status so admin can see it
    await supabase
      .from("sessions")
      .update({ status: "room_creation_failed" })
      .eq("id", session.id);
    console.error("[video-sessions] Daily.co room creation failed:", err);
    return NextResponse.json(
      { error: "Session saved but video room creation failed. Retry from the dashboard." },
      { status: 500 }
    );
  }

  // Save room details back onto the session
  await supabase
    .from("sessions")
    .update({ daily_room_name: roomName, daily_room_url: roomUrl })
    .eq("id", session.id);

  // Email student their join link (if they have an email)
  if (student.email) {
    const sessionDate = new Date(scheduled_at);
    const formatted = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
      timeZone: "America/New_York",
    }).format(sessionDate);

    const joinUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://ivystorylab.com"}/session/${session.id}`;
    const fromEmail = process.env.CONTACT_FROM_EMAIL ?? "noreply@ivystorylab.com";

    try {
      await resend.emails.send({
        from: fromEmail,
        to: student.email,
        subject: "Your StoryLab session is scheduled",
        html: `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #2d3e29; line-height: 1.7; padding: 2rem;">
  <p style="font-size: 0.75rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #71717a; margin-bottom: 1.5rem;">StoryLab</p>
  <h1 style="font-size: 1.75rem; font-weight: 600; color: #18181b; margin-bottom: 1.5rem; line-height: 1.2;">Session scheduled.</h1>
  <p>Hi ${student.name},</p>
  <p>Sam has scheduled a session with you. Here are the details:</p>

  <div style="background: #f8faf5; border-left: 3px solid #2C4A3E; padding: 1.25rem 1.5rem; margin: 1.5rem 0; border-radius: 0 8px 8px 0;">
    <p style="margin: 0 0 0.5rem;"><strong>Date &amp; Time:</strong> ${formatted}</p>
    <p style="margin: 0;"><strong>Join link:</strong> <a href="${joinUrl}" style="color: #2C4A3E;">${joinUrl}</a></p>
  </div>

  <p>Click the link above at session time to join. No download required — it runs in your browser.</p>
  <p>See you soon,<br/>Sam</p>

  <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 2rem 0;" />
  <p style="font-size: 0.8rem; color: #a1a1aa;">StoryLab &middot; ivystorylab.com</p>
</div>`,
      });
    } catch (err) {
      // Email failure is non-fatal — session is created, admin can share link manually
      console.error("[video-sessions] Student email failed:", err);
    }
  }

  return NextResponse.json({ ...session, daily_room_url: roomUrl }, { status: 201 });
}

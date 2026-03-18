// PATCH /api/admin/video-sessions/[id] — edit scheduled_at and/or session_type
// DELETE /api/admin/video-sessions/[id] — cancel session, notify student, delete Daily.co room

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getCallerUser, getUserRole } from "@/lib/lab-auth";
import { getCallerTeacher } from "@/lib/teacher";
import { deleteDailyRoom } from "@/lib/daily";
import { Resend } from "resend";
import type { SessionType } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (getUserRole(user) !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const teacher = await getCallerTeacher(user.id);
  if (!teacher) return NextResponse.json({ error: "Teacher profile not found" }, { status: 403 });

  const body = await req.json();
  const { scheduled_at, session_type } = body as {
    scheduled_at?: string;
    session_type?: SessionType;
  };

  if (!scheduled_at && !session_type) {
    return NextResponse.json(
      { error: "At least one of scheduled_at or session_type is required" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // Verify session exists and belongs to this teacher
  const { data: existing, error: fetchErr } = await supabase
    .from("sessions")
    .select("id, status, teacher_id")
    .eq("id", id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (existing.teacher_id !== teacher.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: Record<string, string> = {};
  if (scheduled_at) {
    updates.scheduled_at = scheduled_at;
    updates.date = new Date(scheduled_at).toISOString().split("T")[0];
  }
  if (session_type) {
    updates.session_type = session_type;
  }

  const { data: updated, error: updateErr } = await supabase
    .from("sessions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateErr || !updated) {
    return NextResponse.json(
      { error: updateErr?.message ?? "Failed to update session" },
      { status: 500 }
    );
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (getUserRole(user) !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const teacher = await getCallerTeacher(user.id);
  if (!teacher) return NextResponse.json({ error: "Teacher profile not found" }, { status: 403 });

  const supabase = getSupabase();

  // Fetch session + student email; verify ownership
  const { data: session, error: fetchErr } = await supabase
    .from("sessions")
    .select("id, teacher_id, student_id, daily_room_name, scheduled_at, students(name, email), teachers(name)")
    .eq("id", id)
    .single();

  if (fetchErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.teacher_id !== teacher.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete Daily.co room (non-fatal if already gone)
  if (session.daily_room_name) {
    try {
      await deleteDailyRoom(session.daily_room_name);
    } catch (err) {
      console.error("[video-sessions/delete] Daily.co room deletion failed:", err);
    }
  }

  // Delete session row (cascades to session_messages)
  const { error: deleteErr } = await supabase
    .from("sessions")
    .delete()
    .eq("id", id);

  if (deleteErr) {
    return NextResponse.json(
      { error: deleteErr.message ?? "Failed to delete session" },
      { status: 500 }
    );
  }

  // Email student (non-fatal)
  const student = session.students as any;
  const teacherFirstName = ((session as any).teachers as any)?.name?.split(" ")[0] ?? "Your coach";
  if (student?.email) {
    const scheduledAt = session.scheduled_at
      ? new Date(session.scheduled_at).toLocaleString("en-US", {
          weekday: "long", month: "long", day: "numeric",
          hour: "numeric", minute: "2-digit", timeZone: "America/New_York",
        })
      : "your upcoming session";
    const fromEmail = process.env.CONTACT_FROM_EMAIL ?? "noreply@ivystorylab.com";

    try {
      await resend.emails.send({
        from: fromEmail,
        to: student.email,
        subject: "Your StoryLab session has been cancelled",
        html: `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #2d3e29; line-height: 1.7; padding: 2rem;">
  <p style="font-size: 0.75rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #71717a; margin-bottom: 1.5rem;">StoryLab</p>
  <h1 style="font-size: 1.5rem; font-weight: 600; color: #18181b; margin-bottom: 1.5rem;">Session cancelled.</h1>
  <p>Hi ${student.name},</p>
  <p>Your session scheduled for <strong>${scheduledAt}</strong> has been cancelled. ${teacherFirstName} will be in touch to reschedule.</p>
  <p>See you soon,<br/>${teacherFirstName}</p>
  <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 2rem 0;" />
  <p style="font-size: 0.8rem; color: #a1a1aa;">StoryLab &middot; ivystorylab.com</p>
</div>`,
      });
    } catch (err) {
      console.error("[video-sessions/delete] Cancellation email failed:", err);
    }
  }

  return NextResponse.json({ success: true });
}

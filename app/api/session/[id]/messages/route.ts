// GET  /api/session/[id]/messages — fetch thread (teacher or owning student)
// POST /api/session/[id]/messages — save message; emails the other party

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getCallerUser, getUserRole, getCallerStudentId } from "@/lib/lab-auth";
import { getCallerTeacher, getTeacherEmailBySession, getStudentBySession } from "@/lib/teacher";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function resolveAccess(
  user: NonNullable<Awaited<ReturnType<typeof getCallerUser>>>,
  sessionId: string
): Promise<{ allowed: boolean; role: "teacher" | "student" }> {
  const role = getUserRole(user);
  const supabase = getSupabase();

  if (role === "teacher") {
    const teacher = await getCallerTeacher(user.id);
    if (!teacher) return { allowed: false, role: "teacher" };
    const { data } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("teacher_id", teacher.id)
      .maybeSingle();
    return { allowed: !!data, role: "teacher" };
  }

  // Student: verify session belongs to them
  const studentId = await getCallerStudentId(user.id);
  if (!studentId) return { allowed: false, role: "student" };
  const { data } = await supabase
    .from("sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("student_id", studentId)
    .maybeSingle();
  return { allowed: !!data, role: "student" };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { allowed } = await resolveAccess(user, id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("session_messages")
    .select("id, sender_role, body, created_at")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed, role } = await resolveAccess(user, id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { body } = await req.json();
  if (!body?.trim()) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data: message, error } = await supabase
    .from("session_messages")
    .insert({ session_id: id, sender_role: role, body: body.trim() })
    .select()
    .single();

  if (error || !message) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to save message" },
      { status: 500 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ivystorylab.com";
  const sessionUrl = `${siteUrl}/session/${id}`;
  const fromEmail = process.env.CONTACT_FROM_EMAIL ?? "noreply@ivystorylab.com";

  // Get session date for email subject
  const { data: sessionRow } = await supabase
    .from("sessions")
    .select("scheduled_at, session_type")
    .eq("id", id)
    .maybeSingle();
  const scheduledAt = sessionRow?.scheduled_at
    ? new Date(sessionRow.scheduled_at).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/New_York",
      })
    : "upcoming session";

  if (role === "student") {
    // Student sent message → email teacher
    const teacherEmail = await getTeacherEmailBySession(id);
    if (teacherEmail) {
      const student = await getStudentBySession(id);
      const studentName = student?.name ?? "A student";
      try {
        await resend.emails.send({
          from: fromEmail,
          to: teacherEmail,
          subject: `${studentName} left a note for your ${scheduledAt} session`,
          html: `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #2d3e29; line-height: 1.7; padding: 2rem;">
  <p style="font-size: 0.75rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #71717a; margin-bottom: 1.5rem;">StoryLab</p>
  <p>${studentName} sent a message about your <strong>${scheduledAt}</strong> session:</p>
  <blockquote style="border-left: 3px solid #2C4A3E; margin: 1.5rem 0; padding: 0.75rem 1.25rem; background: #f8faf5; border-radius: 0 8px 8px 0;">
    <p style="margin: 0; font-style: italic; color: #3f3f46;">${body.trim()}</p>
  </blockquote>
  <p><a href="${sessionUrl}" style="color: #2C4A3E;">View session thread →</a></p>
  <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 2rem 0;" />
  <p style="font-size: 0.8rem; color: #a1a1aa;">StoryLab &middot; ivystorylab.com</p>
</div>`,
        });
      } catch (err) {
        console.error("[session/messages] email to teacher failed:", err);
      }
    }
  } else {
    // Teacher sent message → email student
    const student = await getStudentBySession(id);
    if (student?.email) {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: student.email,
          subject: `Your coach replied about your ${scheduledAt} session`,
          html: `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #2d3e29; line-height: 1.7; padding: 2rem;">
  <p style="font-size: 0.75rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #71717a; margin-bottom: 1.5rem;">StoryLab</p>
  <p>Your coach replied about your <strong>${scheduledAt}</strong> session:</p>
  <blockquote style="border-left: 3px solid #2C4A3E; margin: 1.5rem 0; padding: 0.75rem 1.25rem; background: #f8faf5; border-radius: 0 8px 8px 0;">
    <p style="margin: 0; font-style: italic; color: #3f3f46;">${body.trim()}</p>
  </blockquote>
  <p><a href="${sessionUrl}" style="color: #2C4A3E;">View session thread →</a></p>
  <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 2rem 0;" />
  <p style="font-size: 0.8rem; color: #a1a1aa;">StoryLab &middot; ivystorylab.com</p>
</div>`,
        });
      } catch (err) {
        console.error("[session/messages] email to student failed:", err);
      }
    }
  }

  return NextResponse.json(message, { status: 201 });
}

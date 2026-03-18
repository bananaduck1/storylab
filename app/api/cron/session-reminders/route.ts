// GET /api/cron/session-reminders
// Runs hourly via Vercel cron. Emails students whose sessions start in 23–25h.
// Uses reminder_sent_at as an idempotency guard — won't re-send if already set.

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  // Window: sessions starting between now+23h and now+25h
  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("id, scheduled_at, session_type, student_id, students(name, email), teachers(name)")
    .eq("status", "scheduled")
    .is("reminder_sent_at", null)
    .gte("scheduled_at", windowStart.toISOString())
    .lte("scheduled_at", windowEnd.toISOString());

  if (error) {
    console.error("[session-reminders] DB query failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const fromEmail = process.env.CONTACT_FROM_EMAIL ?? "noreply@ivystorylab.com";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ivystorylab.com";

  let sent = 0;
  for (const session of sessions) {
    const student = session.students as any;
    const teacherFirstName = ((session as any).teachers as any)?.name?.split(" ")[0] ?? "your coach";
    if (!student?.email) continue;

    const joinUrl = `${siteUrl}/session/${session.id}`;
    const formatted = new Intl.DateTimeFormat("en-US", {
      weekday: "long", month: "long", day: "numeric",
      hour: "numeric", minute: "2-digit", timeZoneName: "short",
      timeZone: "America/New_York",
    }).format(new Date(session.scheduled_at));

    try {
      await resend.emails.send({
        from: fromEmail,
        to: student.email,
        subject: "Your StoryLab session is tomorrow",
        html: `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #2d3e29; line-height: 1.7; padding: 2rem;">
  <p style="font-size: 0.75rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #71717a; margin-bottom: 1.5rem;">StoryLab</p>
  <h1 style="font-size: 1.5rem; font-weight: 600; color: #18181b; margin-bottom: 1.5rem;">Session tomorrow.</h1>
  <p>Hi ${student.name},</p>
  <p>Just a reminder — you have a session with ${teacherFirstName} tomorrow:</p>
  <div style="background: #f8faf5; border-left: 3px solid #2C4A3E; padding: 1.25rem 1.5rem; margin: 1.5rem 0; border-radius: 0 8px 8px 0;">
    <p style="margin: 0 0 0.5rem;"><strong>When:</strong> ${formatted}</p>
    <p style="margin: 0;"><strong>Join link:</strong> <a href="${joinUrl}" style="color: #2C4A3E;">${joinUrl}</a></p>
  </div>
  <p>You can also leave ${teacherFirstName} a note or let them know if something comes up — just visit the link above before your session.</p>
  <p>See you tomorrow,<br/>${teacherFirstName}</p>
  <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 2rem 0;" />
  <p style="font-size: 0.8rem; color: #a1a1aa;">StoryLab &middot; ivystorylab.com</p>
</div>`,
      });

      // Mark as sent (idempotency guard)
      await supabase
        .from("sessions")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", session.id);

      sent++;
    } catch (err) {
      console.error(`[session-reminders] Email failed for session ${session.id}:`, err);
    }
  }

  return NextResponse.json({ sent });
}

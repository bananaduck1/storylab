import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getCallerUser } from "@/lib/lab-auth";
import { getCallerTeacher } from "@/lib/teacher";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teacher = await getCallerTeacher(user.id);
  if (!teacher) return NextResponse.json({ error: "Not a teacher" }, { status: 403 });

  const { student_id } = await req.json();
  if (!student_id) return NextResponse.json({ error: "student_id is required" }, { status: 400 });

  const db = getSupabase();
  const { data: student, error } = await db
    .from("students")
    .select("id, name, email, user_id, teacher_id")
    .eq("id", student_id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  if (student.teacher_id && student.teacher_id !== teacher.id) {
    return NextResponse.json({ error: "Student belongs to another teacher" }, { status: 403 });
  }
  if (student.user_id) return NextResponse.json({ error: "Student already linked" }, { status: 409 });
  if (!student.email) return NextResponse.json({ error: "No email on file" }, { status: 422 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ivystorylab.com";
  const claimUrl = `${siteUrl}/lab/claim/${student.id}`;
  const from = process.env.CONTACT_FROM_EMAIL ?? "onboarding@resend.dev";
  const firstName = teacher.name.split(" ")[0];

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: sendError } = await resend.emails.send({
    from,
    to: student.email,
    subject: "Your IvyStoryLab account is ready",
    text: [
      `Hi ${student.name},`,
      "",
      `${firstName} has set up your IvyStoryLab account. Click the link below to connect your account and start working with your AI essay coach:`,
      "",
      claimUrl,
      "",
      "If you don't have an account yet, you'll be prompted to create one first.",
      "",
      "— IvyStoryLab",
    ].join("\n"),
    html: `
<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#3f3f46;font-size:17px;line-height:1.75;">
  <p style="margin:0 0 16px;">Hi ${student.name},</p>
  <p style="margin:0 0 24px;">${firstName} has set up your IvyStoryLab account. Click below to connect your account and start working with your AI essay coach:</p>
  <a href="${claimUrl}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-family:sans-serif;">
    Access your account →
  </a>
  <p style="margin:28px 0 0;font-size:14px;color:#71717a;">If you don't have an account yet, you'll be prompted to create one first.</p>
  <hr style="border:none;border-top:1px solid #e4e4e7;margin:32px 0 24px;" />
  <p style="font-size:13px;color:#a1a1aa;">IvyStoryLab</p>
</div>`,
  });

  if (sendError) return NextResponse.json({ error: sendError.message }, { status: 500 });
  return NextResponse.json({ sent: true });
}

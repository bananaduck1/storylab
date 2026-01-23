import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "parentName",
      "parentEmail",
      "preferredContact",
      "studentName",
      "grade",
      "programInterest",
      "goals",
    ];

    for (const field of requiredFields) {
      if (!body[field] || (typeof body[field] === "string" && body[field].trim() === "")) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.parentEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const resend = getResend();
    if (!resend) {
      return NextResponse.json(
        { error: "Email service not configured. Please contact us directly." },
        { status: 500 }
      );
    }

    const toEmail = process.env.CONTACT_TO_EMAIL || "storylab.ivy@gmail.com";
    const fromEmail = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";

    // Format email content
    const availabilityText =
      body.availability && body.availability.length > 0
        ? body.availability.join(", ")
        : "Not specified";

    const emailContent = `
New StoryLab Inquiry

PARENT/GUARDIAN
Name: ${body.parentName}
Email: ${body.parentEmail}
Phone: ${body.parentPhone || "Not provided"}
Preferred contact: ${body.preferredContact}

STUDENT
Name: ${body.studentName}
Grade: ${body.grade}
School: ${body.school || "Not provided"}

NEEDS
Program interest: ${body.programInterest}
Goals/context: ${body.goals}
Weekly availability: ${availabilityText}
Engagement preference: ${body.engagementPreference || "Not specified"}
`;

    // Send email
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: body.parentEmail,
      subject: `New StoryLab Inquiry from ${body.parentName}`,
      text: emailContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send inquiry. Please try again or email us directly." },
      { status: 500 }
    );
  }
}

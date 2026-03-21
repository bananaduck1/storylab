// POST /api/demo
// Receives institutional demo requests from /demo.
// Validates fields, drops honeypot submissions silently, rate-limits by IP,
// then sends an email via Resend to the admin.
// No DB — add demo_inquiries table when volume justifies it.

import { NextRequest, NextResponse } from "next/server";
import { getResend } from "@/lib/resend";

// In-memory sliding-window rate limit: 3 submissions per IP per hour.
// NOTE: resets on cold start (serverless). Upgrade to Upstash Redis if abuse occurs.
const ipHits = new Map<string, number[]>();
const LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= LIMIT) return true;
  hits.push(now);
  ipHits.set(ip, hits);
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Honeypot: real users leave this field empty
    if (body.website) {
      return NextResponse.json({ ok: true });
    }

    // IP rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Validate required fields
    const required = ["name", "role", "school", "message"] as const;
    for (const field of required) {
      if (!body[field] || (typeof body[field] === "string" && body[field].trim() === "")) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const resend = getResend();
    if (!resend) {
      return NextResponse.json(
        { error: "Email service not configured. Please contact us directly." },
        { status: 500 }
      );
    }

    const toEmail = process.env.DEMO_TO_EMAIL ?? process.env.CONTACT_TO_EMAIL ?? "storylab.ivy@gmail.com";
    const fromEmail = process.env.CONTACT_FROM_EMAIL ?? "onboarding@resend.dev";

    const emailText = `
New StoryLab Demo Request

Name:           ${body.name}
Role:           ${body.role}
School/District: ${body.school}

Message:
${body.message}

---
Submitted via /demo on storylab.co
`;

    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `Demo Request — ${body.name} (${body.role}, ${body.school})`,
      text: emailText,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/demo] error:", error);
    return NextResponse.json(
      { error: "Failed to send. Please try again or email us directly." },
      { status: 500 }
    );
  }
}

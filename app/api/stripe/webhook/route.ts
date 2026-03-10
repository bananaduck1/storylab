import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";
import { createCalendarEvent } from "@/lib/google-calendar";
import { Resend } from "resend";

// Tell Next.js not to parse the body — Stripe needs the raw bytes for signature verification
export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

function formatET(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error("[stripe/webhook] Signature error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bookingId = session.metadata?.booking_id;

    if (!bookingId) {
      console.error("[stripe/webhook] No booking_id in metadata");
      return NextResponse.json({ error: "No booking_id in metadata" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Fetch booking + associated slot time
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*, availability:availability_id(datetime)")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      console.error("[stripe/webhook] Booking not found:", bookingId);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Mark booking as confirmed
    await supabase
      .from("bookings")
      .update({ status: "confirmed", stripe_session_id: session.id })
      .eq("id", bookingId);

    const slotTime = new Date(booking.availability.datetime);
    const slotEnd = new Date(slotTime.getTime() + 60 * 60 * 1000);
    const formattedTime = formatET(slotTime);

    const myEmail = process.env.MY_EMAIL ?? "samahn240@gmail.com";
    const fromEmail = process.env.CONTACT_FROM_EMAIL ?? "noreply@ivystorylab.com";

    // ── Send emails ───────────────────────────────────────────────────────────
    try {
      // Parent confirmation
      await resend.emails.send({
        from: fromEmail,
        to: booking.parent_email,
        subject: "Your StoryLab Consultation is Confirmed",
        html: `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #2d3e29; line-height: 1.7; padding: 2rem;">
  <p style="font-size: 0.75rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #71717a; margin-bottom: 1.5rem;">StoryLab</p>
  <h1 style="font-size: 1.75rem; font-weight: 600; color: #18181b; margin-bottom: 1.5rem; line-height: 1.2;">You&rsquo;re confirmed.</h1>
  <p>Hi ${booking.parent_name},</p>
  <p>Your 1-hour Parent Consultation with Sam Ahn is booked. Here are the details:</p>

  <div style="background: #f8faf5; border-left: 3px solid #2C4A3E; padding: 1.25rem 1.5rem; margin: 1.5rem 0; border-radius: 0 8px 8px 0;">
    <p style="margin: 0 0 0.5rem;"><strong>Date &amp; Time:</strong> ${formattedTime}</p>
    <p style="margin: 0 0 0.5rem;"><strong>Duration:</strong> 1 hour</p>
    <p style="margin: 0;"><strong>Zoom Link:</strong> Sam will send this 24 hours before your session.</p>
  </div>

  <h2 style="font-size: 1.1rem; font-weight: 600; margin-top: 2rem; color: #18181b;">How to prepare</h2>
  <ul style="padding-left: 1.5rem; color: #3f3f46;">
    <li style="margin-bottom: 0.5rem;">Gather any writing your student has done — essays, short answers, class papers, anything.</li>
    <li style="margin-bottom: 0.5rem;">Think about the moments and experiences that define your student beyond their résumé.</li>
    <li style="margin-bottom: 0.5rem;">Write down your top 2–3 questions about the college application process.</li>
    <li style="margin-bottom: 0.5rem;">No formal preparation is required — the more context you can share, the more useful our time will be.</li>
  </ul>

  <p style="margin-top: 2rem;">If you need to reschedule, reply to this email or write to <a href="mailto:storylab.ivy@gmail.com" style="color: #2C4A3E;">storylab.ivy@gmail.com</a>.</p>
  <p>See you soon,<br/>Sam</p>

  <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 2rem 0;" />
  <p style="font-size: 0.8rem; color: #a1a1aa;">StoryLab &middot; ivystorylab.com</p>
</div>`,
      });

      // Admin notification
      await resend.emails.send({
        from: fromEmail,
        to: myEmail,
        subject: `New Consultation — ${booking.parent_name}`,
        html: `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #18181b; line-height: 1.7; padding: 2rem;">
  <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem;">New Consultation Booked</h2>

  <table style="width: 100%; border-collapse: collapse;">
    <tr><td style="padding: 0.5rem 0; font-weight: 600; width: 140px; color: #71717a;">Parent</td><td>${booking.parent_name}</td></tr>
    <tr><td style="padding: 0.5rem 0; font-weight: 600; color: #71717a;">Email</td><td><a href="mailto:${booking.parent_email}" style="color: #2C4A3E;">${booking.parent_email}</a></td></tr>
    <tr><td style="padding: 0.5rem 0; font-weight: 600; color: #71717a;">Time</td><td>${formattedTime}</td></tr>
    <tr><td style="padding: 0.5rem 0; font-weight: 600; color: #71717a;">Grade</td><td>${booking.student_grade}</td></tr>
    <tr><td style="padding: 0.5rem 0; font-weight: 600; color: #71717a;">Schools</td><td>${booking.schools}</td></tr>
    <tr><td style="padding: 0.5rem 0; font-weight: 600; color: #71717a;">Payment</td><td>Confirmed &mdash; $500</td></tr>
    <tr><td style="padding: 0.5rem 0; font-weight: 600; color: #71717a;">Stripe</td><td style="font-size: 0.8rem; font-family: monospace;">${session.id}</td></tr>
  </table>

  <h3 style="font-size: 1rem; font-weight: 600; margin-top: 1.5rem; color: #71717a;">Essay Context</h3>
  <blockquote style="border-left: 3px solid #a1a1aa; padding-left: 1.25rem; margin: 0.75rem 0; color: #3f3f46; font-style: italic;">
    ${booking.essay_context.replace(/\n/g, "<br/>")}
  </blockquote>

  <p style="margin-top: 1.5rem;">
    <a href="https://ivystorylab.com/admin/availability" style="color: #2C4A3E;">Manage availability &rarr;</a>
  </p>
</div>`,
      });
    } catch (emailErr) {
      console.error("[stripe/webhook] Email failed:", emailErr);
      // Non-fatal — booking is already confirmed
    }

    // ── Create Google Calendar event ──────────────────────────────────────────
    try {
      await createCalendarEvent({
        title: `StoryLab Consultation — ${booking.parent_name}`,
        start: slotTime,
        end: slotEnd,
        attendeeEmails: [booking.parent_email, myEmail],
        description: [
          `Parent Consultation · 1 hour`,
          ``,
          `Parent: ${booking.parent_name} <${booking.parent_email}>`,
          `Student Grade: ${booking.student_grade}`,
          `Schools: ${booking.schools}`,
          ``,
          `Essay Context:`,
          booking.essay_context,
          ``,
          `Zoom: [ADD ZOOM LINK BEFORE THE CALL]`,
          ``,
          `Stripe: ${session.id}`,
          `Booking: ${bookingId}`,
        ].join("\n"),
      });
    } catch (calErr) {
      console.error("[stripe/webhook] Calendar event failed:", calErr);
      // Non-fatal
    }
  }

  return NextResponse.json({ received: true });
}

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";
import { createCalendarEvent } from "@/lib/google-calendar";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Formatting helpers ────────────────────────────────────────────────────────

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

function formatLocal(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function formatTimeShort(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

const EASTERN_ZONES = new Set([
  "America/New_York",
  "America/Detroit",
  "America/Indiana/Indianapolis",
  "America/Kentucky/Louisville",
]);

function formattedTimeForParent(slotTime: Date, visitorTz: string): string {
  const et = formatET(slotTime);
  if (EASTERN_ZONES.has(visitorTz)) return et;
  return `${formatLocal(slotTime, visitorTz)} (${formatTimeShort(slotTime, "America/New_York")})`;
}

// ── Supabase type ─────────────────────────────────────────────────────────────

type Booking = {
  id: string;
  parent_name: string;
  parent_email: string;
  student_grade: string;
  schools: string;
  essay_context: string;
  availability_id: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  visitor_timezone: string | null;
  status: string;
  availability: { datetime: string } | null;
};

// ── Shared helpers ────────────────────────────────────────────────────────────

async function fetchBookingByPaymentIntent(paymentIntentId: string): Promise<Booking | null> {
  const { data } = await getSupabase()
    .from("bookings")
    .select("*, availability:availability_id(datetime)")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single();

  if (!data) return null;
  const raw = data as Booking & { availability: { datetime: string } | { datetime: string }[] | null };
  return {
    ...raw,
    availability: Array.isArray(raw.availability) ? (raw.availability[0] ?? null) : raw.availability,
  };
}

// Sends confirmation email to parent + admin notification + creates calendar event.
// Called for both immediate payments (card) and ACH after payment_intent.succeeded.
async function confirmBooking(
  booking: Booking,
  stripeSessionId: string,
  myEmail: string,
  fromEmail: string
) {
  const slotTime = new Date(booking.availability!.datetime);
  const slotEnd  = new Date(slotTime.getTime() + 60 * 60 * 1000);
  const visitorTz = booking.visitor_timezone ?? "America/New_York";
  const timeForParent = formattedTimeForParent(slotTime, visitorTz);
  const timeET        = formatET(slotTime);

  // Parent confirmation email
  try {
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
    <p style="margin: 0 0 0.5rem;"><strong>Date &amp; Time:</strong> ${timeForParent}</p>
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
  } catch (err) {
    console.error("[stripe/webhook] Parent confirmation email failed:", err);
  }

  // Admin notification
  try {
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
    <tr><td style="padding: 0.5rem 0; font-weight: 600; color: #71717a;">Time (ET)</td><td>${timeET}</td></tr>
    <tr><td style="padding: 0.5rem 0; font-weight: 600; color: #71717a;">Grade</td><td>${booking.student_grade}</td></tr>
    <tr><td style="padding: 0.5rem 0; font-weight: 600; color: #71717a;">Schools</td><td>${booking.schools}</td></tr>
    <tr><td style="padding: 0.5rem 0; font-weight: 600; color: #71717a;">Payment</td><td>Confirmed &mdash; $500</td></tr>
    <tr><td style="padding: 0.5rem 0; font-weight: 600; color: #71717a;">Stripe</td><td style="font-size: 0.8rem; font-family: monospace;">${stripeSessionId}</td></tr>
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
  } catch (err) {
    console.error("[stripe/webhook] Admin notification email failed:", err);
  }

  // Google Calendar event
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
        `Stripe: ${stripeSessionId}`,
        `Booking: ${booking.id}`,
      ].join("\n"),
    });
  } catch (err) {
    console.error("[stripe/webhook] Calendar event failed:", err);
  }
}

// ── Event handlers ────────────────────────────────────────────────────────────

async function handleSessionCompleted(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    console.error("[stripe/webhook] checkout.session.completed: no booking_id in metadata");
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

  const visitorTz = session.metadata?.visitor_timezone ?? "America/New_York";
  const supabase  = getSupabase();
  const myEmail   = process.env.MY_EMAIL ?? "samahn240@gmail.com";
  const fromEmail = process.env.CONTACT_FROM_EMAIL ?? "noreply@ivystorylab.com";

  // For immediate payments (card, Alipay, Link, WeChat): payment_status === 'paid'
  // For ACH: payment_status === 'unpaid' — payment will arrive via payment_intent events
  const isPaid = session.payment_status === "paid";

  // Persist payment intent ID and visitor timezone onto the booking
  await supabase
    .from("bookings")
    .update({
      stripe_session_id:        session.id,
      stripe_payment_intent_id: paymentIntentId,
      visitor_timezone:         visitorTz,
      status:                   isPaid ? "confirmed" : "pending_payment",
    })
    .eq("id", bookingId);

  if (isPaid) {
    // Fetch full booking for email/calendar
    const { data } = await supabase
      .from("bookings")
      .select("*, availability:availability_id(datetime)")
      .eq("id", bookingId)
      .single();

    if (!data) {
      console.error("[stripe/webhook] checkout.session.completed: booking not found after update");
      return;
    }

    const raw = data as Booking & { availability: { datetime: string } | { datetime: string }[] | null };
    const booking: Booking = {
      ...raw,
      availability: Array.isArray(raw.availability) ? (raw.availability[0] ?? null) : raw.availability,
    };

    await confirmBooking(booking, session.id, myEmail, fromEmail);
  }
  // ACH: no email yet — wait for payment_intent.processing and payment_intent.succeeded
}

async function handlePaymentProcessing(paymentIntent: Stripe.PaymentIntent) {
  const booking = await fetchBookingByPaymentIntent(paymentIntent.id);
  if (!booking) {
    // Not one of our bookings — skip silently
    return;
  }

  const fromEmail = process.env.CONTACT_FROM_EMAIL ?? "noreply@ivystorylab.com";

  await getSupabase()
    .from("bookings")
    .update({ status: "processing" })
    .eq("id", booking.id);

  const slotTime      = new Date(booking.availability!.datetime);
  const visitorTz     = booking.visitor_timezone ?? "America/New_York";
  const timeForParent = formattedTimeForParent(slotTime, visitorTz);

  try {
    await resend.emails.send({
      from: fromEmail,
      to: booking.parent_email,
      subject: "Your StoryLab payment is being processed",
      html: `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #2d3e29; line-height: 1.7; padding: 2rem;">
  <p style="font-size: 0.75rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #71717a; margin-bottom: 1.5rem;">StoryLab</p>
  <h1 style="font-size: 1.75rem; font-weight: 600; color: #18181b; margin-bottom: 1.5rem; line-height: 1.2;">Payment in progress.</h1>
  <p>Hi ${booking.parent_name},</p>
  <p>We received your bank transfer and your payment is now being processed. ACH transfers typically clear within 1–3 business days.</p>

  <div style="background: #f8faf5; border-left: 3px solid #2C4A3E; padding: 1.25rem 1.5rem; margin: 1.5rem 0; border-radius: 0 8px 8px 0;">
    <p style="margin: 0 0 0.5rem;"><strong>Session:</strong> Parent Consultation · 1 hour</p>
    <p style="margin: 0 0 0.5rem;"><strong>Date &amp; Time:</strong> ${timeForParent}</p>
    <p style="margin: 0;"><strong>Amount:</strong> $500 USD</p>
  </div>

  <p>Your time slot is reserved. You&rsquo;ll receive a full confirmation email as soon as payment clears.</p>
  <p>Questions? Write to <a href="mailto:storylab.ivy@gmail.com" style="color: #2C4A3E;">storylab.ivy@gmail.com</a>.</p>

  <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 2rem 0;" />
  <p style="font-size: 0.8rem; color: #a1a1aa;">StoryLab &middot; ivystorylab.com</p>
</div>`,
    });
  } catch (err) {
    console.error("[stripe/webhook] Payment processing email failed:", err);
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const booking = await fetchBookingByPaymentIntent(paymentIntent.id);
  if (!booking) return;

  // Idempotency guard — don't double-confirm or double-send
  if (booking.status === "confirmed") {
    console.log("[stripe/webhook] payment_intent.succeeded: booking already confirmed, skipping");
    return;
  }

  const myEmail   = process.env.MY_EMAIL ?? "samahn240@gmail.com";
  const fromEmail = process.env.CONTACT_FROM_EMAIL ?? "noreply@ivystorylab.com";

  await getSupabase()
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", booking.id);

  await confirmBooking(
    booking,
    booking.stripe_session_id ?? paymentIntent.id,
    myEmail,
    fromEmail
  );
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const booking = await fetchBookingByPaymentIntent(paymentIntent.id);
  if (!booking) return;

  // Don't re-process if already handled
  if (booking.status === "failed") return;

  const supabase  = getSupabase();
  const fromEmail = process.env.CONTACT_FROM_EMAIL ?? "noreply@ivystorylab.com";

  // Mark booking failed and release the slot
  await supabase.from("bookings").update({ status: "failed" }).eq("id", booking.id);
  await supabase.from("availability").update({ is_booked: false }).eq("id", booking.availability_id);

  const slotTime      = new Date(booking.availability!.datetime);
  const visitorTz     = booking.visitor_timezone ?? "America/New_York";
  const timeForParent = formattedTimeForParent(slotTime, visitorTz);
  const failureReason = paymentIntent.last_payment_error?.message ?? "your bank declined the transfer";

  try {
    await resend.emails.send({
      from: fromEmail,
      to: booking.parent_email,
      subject: "Your StoryLab payment did not go through",
      html: `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #2d3e29; line-height: 1.7; padding: 2rem;">
  <p style="font-size: 0.75rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #71717a; margin-bottom: 1.5rem;">StoryLab</p>
  <h1 style="font-size: 1.75rem; font-weight: 600; color: #18181b; margin-bottom: 1.5rem; line-height: 1.2;">Payment unsuccessful.</h1>
  <p>Hi ${booking.parent_name},</p>
  <p>Unfortunately your payment for the StoryLab Parent Consultation did not go through. Your time slot has been released.</p>

  <div style="background: #fff5f5; border-left: 3px solid #f87171; padding: 1.25rem 1.5rem; margin: 1.5rem 0; border-radius: 0 8px 8px 0;">
    <p style="margin: 0 0 0.5rem;"><strong>Session:</strong> Parent Consultation · ${timeForParent}</p>
    <p style="margin: 0;"><strong>Reason:</strong> ${failureReason}</p>
  </div>

  <p>To rebook, please return to <a href="https://ivystorylab.com/academy/pricing/consultation" style="color: #2C4A3E;">ivystorylab.com/academy/pricing/consultation</a> and select a new time. If you&rsquo;d prefer to pay by card or an alternative method, please write to <a href="mailto:storylab.ivy@gmail.com" style="color: #2C4A3E;">storylab.ivy@gmail.com</a> and we&rsquo;ll sort it out.</p>

  <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 2rem 0;" />
  <p style="font-size: 0.8rem; color: #a1a1aa;">StoryLab &middot; ivystorylab.com</p>
</div>`,
    });
  } catch (err) {
    console.error("[stripe/webhook] Payment failed email failed:", err);
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body        = await req.text();
  const headersList = await headers();
  const sig         = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error("[stripe/webhook] Signature error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case "payment_intent.processing":
      await handlePaymentProcessing(event.data.object as Stripe.PaymentIntent);
      break;

    case "payment_intent.succeeded":
      await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;

    case "payment_intent.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;

    default:
      // Ignore unhandled event types
      break;
  }

  return NextResponse.json({ received: true });
}

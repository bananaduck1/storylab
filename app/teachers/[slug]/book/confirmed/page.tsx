import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking Confirmed — StoryLab",
};

function formatET(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(isoString));
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ booking_id?: string }>;
}

export default async function TeacherBookConfirmedPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { booking_id } = await searchParams;

  let booking: {
    id: string;
    parent_name: string;
    parent_email: string;
    student_grade: string;
    availability: { datetime: string } | null;
    teacher: { name: string; slug: string } | null;
  } | null = null;

  if (booking_id) {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("bookings")
      .select("id, parent_name, parent_email, student_grade, availability:availability_id(datetime), teacher:teacher_id(name, slug)")
      .eq("id", booking_id)
      .single();

    if (data) {
      const raw = data as typeof data & {
        availability: { datetime: string } | { datetime: string }[] | null;
        teacher: { name: string; slug: string } | { name: string; slug: string }[] | null;
      };
      booking = {
        ...data,
        availability: Array.isArray(raw.availability)
          ? (raw.availability[0] ?? null)
          : raw.availability,
        teacher: Array.isArray(raw.teacher)
          ? (raw.teacher[0] ?? null)
          : raw.teacher,
      };
    }
  }

  const teacherSlug = booking?.teacher?.slug ?? slug;
  const teacherName = booking?.teacher?.name ?? "your teacher";
  const firstName = teacherName.split(" ")[0];
  const slotTime = booking?.availability?.datetime ? formatET(booking.availability.datetime) : null;

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <div className="mx-auto max-w-2xl px-6 py-20">
        {/* Check mark */}
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: "#DEEEE9" }}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#2C4A3E" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <p
          className="mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/60"
          style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
        >
          Booking Confirmed
        </p>
        <h1
          className="mt-3 text-[2rem] leading-[1.2] tracking-tight text-[#1A2E26]"
          style={{ fontFamily: "var(--font-cooper, serif)" }}
        >
          {booking ? `You're on the calendar, ${booking.parent_name.split(" ")[0]}.` : "You're on the calendar."}
        </h1>

        {booking ? (
          <p
            className="mt-4 text-base leading-relaxed text-[#1A2E26]/60"
            style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
          >
            Your session with {firstName} is confirmed. A confirmation email is on its way to{" "}
            <strong className="font-semibold text-[#1A2E26]">{booking.parent_email}</strong>.
          </p>
        ) : (
          <p
            className="mt-4 text-base leading-relaxed text-[#1A2E26]/60"
            style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
          >
            Your session is confirmed. You&rsquo;ll receive a confirmation email shortly.
          </p>
        )}

        {/* Session details */}
        <div
          className="mt-10 rounded-[4px] border border-[#C0D9CB] bg-white p-8 space-y-5"
        >
          <p
            className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/60"
            style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
          >
            Session details
          </p>

          <dl className="space-y-4">
            <div>
              <dt
                className="text-xs font-medium text-[#1A2E26]/40"
                style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
              >
                With
              </dt>
              <dd
                className="mt-0.5 text-base font-semibold text-[#1A2E26]"
                style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
              >
                {teacherName}
              </dd>
            </div>

            {slotTime && (
              <div>
                <dt
                  className="text-xs font-medium text-[#1A2E26]/40"
                  style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
                >
                  Date &amp; Time
                </dt>
                <dd
                  className="mt-0.5 text-base text-[#1A2E26]"
                  style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
                >
                  {slotTime}
                </dd>
              </div>
            )}

            {booking?.student_grade && (
              <div>
                <dt
                  className="text-xs font-medium text-[#1A2E26]/40"
                  style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
                >
                  Student&rsquo;s Grade
                </dt>
                <dd
                  className="mt-0.5 text-base text-[#1A2E26]"
                  style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
                >
                  {booking.student_grade}
                </dd>
              </div>
            )}

            <div>
              <dt
                className="text-xs font-medium text-[#1A2E26]/40"
                style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
              >
                Session link
              </dt>
              <dd
                className="mt-0.5 text-base text-[#1A2E26]/60"
                style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
              >
                {firstName} will send you a Zoom link 24 hours before your session.
              </dd>
            </div>
          </dl>
        </div>

        {/* Reschedule note */}
        <p
          className="mt-8 text-sm text-[#1A2E26]/40"
          style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
        >
          Need to reschedule?{" "}
          <a
            href="mailto:storylab.ivy@gmail.com"
            className="underline underline-offset-2 hover:text-[#2C4A3E] transition-colors"
          >
            Email us
          </a>
          .
        </p>

        <div className="mt-10">
          <Link
            href={`/teachers/${teacherSlug}`}
            className="inline-flex items-center rounded-[3px] border border-[#C0D9CB] bg-white px-6 py-3 text-sm font-medium text-[#2C4A3E] hover:bg-[#DEEEE9] transition-colors"
            style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
          >
            ← Back to {firstName}&rsquo;s profile
          </Link>
        </div>
      </div>
    </main>
  );
}

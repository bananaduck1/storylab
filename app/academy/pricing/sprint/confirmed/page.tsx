import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sprint Confirmed — StoryLab",
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
  searchParams: Promise<{ booking_id?: string }>;
}

export default async function SprintConfirmedPage({ searchParams }: PageProps) {
  const { booking_id } = await searchParams;

  let booking: {
    id: string;
    parent_name: string;
    parent_email: string;
    student_grade: string;
    schools: string;
    status: string;
    availability: { datetime: string } | null;
  } | null = null;

  if (booking_id) {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("bookings")
      .select("id, parent_name, parent_email, student_grade, schools, status, availability:availability_id(datetime)")
      .eq("id", booking_id)
      .single();

    if (data) {
      const raw = data as typeof data & { availability: { datetime: string } | { datetime: string }[] | null };
      booking = {
        ...data,
        availability: Array.isArray(raw.availability)
          ? (raw.availability[0] ?? null)
          : raw.availability,
      };
    }
  }

  if (!booking) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
          StoryLab
        </p>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-950">
          Booking confirmed.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-500">
          Thank you for booking a Common App Sprint. You&rsquo;ll receive a confirmation email
          shortly with your session details.
        </p>
        <div className="mt-10">
          <Link
            href="/academy"
            className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Back to StoryLab
          </Link>
        </div>
      </div>
    );
  }

  const slotTime = booking.availability?.datetime
    ? formatET(booking.availability.datetime)
    : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-24">
      {/* Confirmation mark */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
        <svg
          className="h-6 w-6 text-emerald-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
        Booking Confirmed
      </p>
      <h1 className="mt-3 text-4xl font-semibold leading-[1.15] tracking-tight text-zinc-950 sm:text-5xl">
        You&rsquo;re on the calendar.
      </h1>

      <p className="mt-5 text-lg leading-relaxed text-zinc-500">
        Hi {booking.parent_name} — your Common App Sprint kickoff is confirmed. A confirmation email
        is on its way to{" "}
        <strong className="font-medium text-zinc-700">{booking.parent_email}</strong>.
      </p>

      {/* Booking details card */}
      <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Session details
        </p>

        <dl className="mt-5 space-y-4">
          <div>
            <dt className="text-sm font-medium text-zinc-400">Offering</dt>
            <dd className="mt-0.5 text-base font-semibold text-zinc-900">
              Common App Sprint
            </dd>
          </div>

          {slotTime && (
            <div>
              <dt className="text-sm font-medium text-zinc-400">Kickoff Date &amp; Time</dt>
              <dd className="mt-0.5 text-base text-zinc-900">{slotTime}</dd>
            </div>
          )}

          <div>
            <dt className="text-sm font-medium text-zinc-400">Student&rsquo;s Grade</dt>
            <dd className="mt-0.5 text-base text-zinc-900">{booking.student_grade}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-zinc-400">Next Steps</dt>
            <dd className="mt-0.5 text-base text-zinc-600">
              Sam will be in touch within 24 hours to confirm your kickoff meeting and share
              everything you need to get started.
            </dd>
          </div>
        </dl>
      </div>

      {/* What to prepare */}
      <div className="mt-8 rounded-2xl border border-zinc-100 bg-white/60 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
          How to prepare
        </p>
        <ul className="mt-4 space-y-3 text-base leading-relaxed text-zinc-600">
          <li className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-300" />
            Gather any writing your student has done — essays, short answers, class papers, anything.
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-300" />
            Think about the moments and experiences that define your student beyond their résumé.
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-300" />
            Note the schools on your student&rsquo;s list and any known supplement prompts.
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-300" />
            No formal preparation required — the more context you can share, the faster we can move.
          </li>
        </ul>
      </div>

      {/* Need to reschedule */}
      <p className="mt-8 text-sm text-zinc-500">
        Need to reschedule?{" "}
        <a
          href="mailto:storylab.ivy@gmail.com"
          className="underline underline-offset-2 hover:text-zinc-900 transition-colors"
        >
          Email us
        </a>
        .
      </p>

      {/* Back link */}
      <div className="mt-10">
        <Link
          href="/academy"
          className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Back to StoryLab
        </Link>
      </div>
    </div>
  );
}

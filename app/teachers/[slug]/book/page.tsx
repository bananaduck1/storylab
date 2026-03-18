"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";

interface Slot {
  id: string;
  datetime: string;
  offering_type: string;
}

interface SlotsByDate {
  [dateKey: string]: Slot[];
}

interface FormData {
  parent_name: string;
  parent_email: string;
  student_grade: string;
  schools: string;
  essay_context: string;
}

const GRADES = [
  "8th Grade", "9th Grade", "10th Grade", "11th Grade", "12th Grade",
  "Gap Year", "College Student",
];

function groupSlotsByDate(slots: Slot[], tz: string): SlotsByDate {
  const groups: SlotsByDate = {};
  for (const slot of slots) {
    const dateKey = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(slot.datetime));
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(slot);
  }
  return groups;
}

function formatDateHeader(isoString: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(isoString));
}

function formatTimeDual(isoString: string, localTz: string): string {
  const date = new Date(isoString);
  const local = new Intl.DateTimeFormat("en-US", {
    timeZone: localTz,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  const et = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
  return `${local} (${et})`;
}

function formatFullDual(isoString: string, localTz: string): string {
  const date = new Date(isoString);
  const localFull = new Intl.DateTimeFormat("en-US", {
    timeZone: localTz,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
  const etTime = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
  return `${localFull} (${etTime})`;
}

// ── Label ─────────────────────────────────────────────────────────────────────

const labelClass =
  "block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-2";
const inputClass =
  "w-full rounded-[4px] border border-[#C0D9CB] bg-white px-4 py-3 text-base text-[#1A2E26] placeholder-[#1A2E26]/30 focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/30";

// ── Main content ──────────────────────────────────────────────────────────────

interface Teacher {
  id: string;
  name: string;
  subject: string | null;
  pricing_config: { sessionPrice?: number } | null;
}

function TeacherBookingContent({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wasCancelled = searchParams.get("cancelled") === "1";

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [teacherLoading, setTeacherLoading] = useState(true);
  const [teacherError, setTeacherError] = useState<string | null>(null);

  const [visitorTz, setVisitorTz] = useState("America/New_York");
  useEffect(() => {
    try { setVisitorTz(Intl.DateTimeFormat().resolvedOptions().timeZone); } catch { /* noop */ }
  }, []);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState<FormData>({
    parent_name: "", parent_email: "", student_grade: "", schools: "", essay_context: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load teacher profile
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/teachers/${slug}`);
        if (!res.ok) throw new Error("Teacher not found");
        const json = await res.json();
        setTeacher(json.teacher);
      } catch (err: unknown) {
        setTeacherError(err instanceof Error ? err.message : "Failed to load teacher.");
      } finally {
        setTeacherLoading(false);
      }
    }
    load();
  }, [slug]);

  // Load slots once we have the teacher
  useEffect(() => {
    if (!teacher) return;
    async function load() {
      try {
        const res = await fetch(`/api/book/slots?offering_type=consultation&teacher_id=${teacher!.id}`);
        if (!res.ok) throw new Error("Failed to load available times.");
        const json = await res.json();
        setSlots(json.slots ?? []);
      } catch (err: unknown) {
        setSlotsError(err instanceof Error ? err.message : "Failed to load slots.");
      } finally {
        setSlotsLoading(false);
      }
    }
    load();
  }, [teacher]);

  const slotsByDate = groupSlotsByDate(slots, visitorTz);
  const sortedDateKeys = Object.keys(slotsByDate).sort();

  const formIsValid =
    selectedSlot &&
    form.parent_name.trim() &&
    form.parent_email.trim() &&
    form.student_grade &&
    form.schools.trim() &&
    form.essay_context.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formIsValid || submitting || !teacher) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/book/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offering_type: "consultation",
          availability_id: selectedSlot!.id,
          teacher_id: teacher.id,
          visitor_timezone: visitorTz,
          ...form,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      router.push(json.url);
    } catch {
      setSubmitError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (teacherLoading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p
          className="text-base text-[#1A2E26]/50"
          style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
        >
          Loading&hellip;
        </p>
      </div>
    );
  }

  if (teacherError || !teacher) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p
          className="text-base text-[#1A2E26]/60"
          style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
        >
          {teacherError ?? "Teacher not found."}
        </p>
        <Link href="/teachers" className="mt-4 inline-block text-sm text-[#2C4A3E] underline">
          ← All teachers
        </Link>
      </div>
    );
  }

  const sessionPrice = teacher.pricing_config?.sessionPrice ?? 500;
  const firstName = teacher.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {wasCancelled && (
        <div
          className="mb-8 rounded-[4px] border border-[#C0D9CB] bg-[#DEEEE9] px-5 py-4 text-sm text-[#1A2E26]/70"
          style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
        >
          Your checkout was cancelled. No charge was made. Please select a time to try again.
        </div>
      )}

      {/* Header */}
      <div className="mb-12">
        <p
          className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/60 mb-3"
          style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
        >
          Live Session
        </p>
        <h1
          className="text-[2rem] leading-[1.2] tracking-tight text-[#1A2E26]"
          style={{ fontFamily: "var(--font-cooper, serif)" }}
        >
          Book a session with {firstName}.
        </h1>
        <p
          className="mt-4 text-base leading-relaxed text-[#1A2E26]/60"
          style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
        >
          1 hour with {teacher.name} &mdash;{" "}
          <strong className="font-semibold text-[#1A2E26]">${sessionPrice}</strong>.
          Select a time, tell us about your student, and pay to confirm.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">

        {/* ── Step 1: Choose a time ────────────────────────────────────────────── */}
        <section>
          <div className="flex items-baseline gap-3 mb-6">
            <span
              className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/40"
              style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
            >
              01
            </span>
            <h2
              className="text-xl tracking-tight text-[#1A2E26]"
              style={{ fontFamily: "var(--font-cooper, serif)" }}
            >
              Choose a time
            </h2>
          </div>
          <p
            className="mb-6 text-sm text-[#1A2E26]/50"
            style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
          >
            Shown in your local time with ET in parentheses.
          </p>

          {slotsLoading && (
            <p
              className="text-sm text-[#1A2E26]/50"
              style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
            >
              Loading available times&hellip;
            </p>
          )}
          {slotsError && (
            <p className="text-sm text-red-600">{slotsError}</p>
          )}
          {!slotsLoading && !slotsError && slots.length === 0 && (
            <div className="rounded-[4px] border border-[#C0D9CB] bg-[#DEEEE9] px-6 py-8 text-center">
              <p
                className="text-sm text-[#1A2E26]/60"
                style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
              >
                No times available right now. Check back soon, or{" "}
                <Link href="/contact" className="underline underline-offset-2 hover:text-[#2C4A3E]">
                  get in touch
                </Link>
                .
              </p>
            </div>
          )}
          {!slotsLoading && !slotsError && slots.length > 0 && (
            <div className="space-y-6">
              {sortedDateKeys.map((dateKey) => (
                <div key={dateKey}>
                  <p
                    className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#2C4A3E]/60"
                    style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
                  >
                    {formatDateHeader(slotsByDate[dateKey][0].datetime, visitorTz)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {slotsByDate[dateKey].map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-[3px] border px-4 py-2.5 text-sm font-medium transition-all duration-75 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40 ${
                          selectedSlot?.id === slot.id
                            ? "border-[#2C4A3E] bg-[#2C4A3E] text-white"
                            : "border-[#C0D9CB] bg-white text-[#1A2E26] hover:border-[#2C4A3E]/50 hover:bg-[#DEEEE9]"
                        }`}
                        style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
                      >
                        {formatTimeDual(slot.datetime, visitorTz)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {selectedSlot && (
            <p
              className="mt-4 text-sm text-[#2C4A3E] font-medium"
              style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
            >
              ✓ {formatFullDual(selectedSlot.datetime, visitorTz)}
            </p>
          )}
        </section>

        {/* ── Step 2: Intake form ──────────────────────────────────────────────── */}
        <section>
          <div className="flex items-baseline gap-3 mb-6">
            <span
              className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/40"
              style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
            >
              02
            </span>
            <h2
              className="text-xl tracking-tight text-[#1A2E26]"
              style={{ fontFamily: "var(--font-cooper, serif)" }}
            >
              Tell us about your student
            </h2>
          </div>

          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="parent_name" className={labelClass}>
                  Your name
                </label>
                <input
                  id="parent_name"
                  type="text"
                  required
                  placeholder="Jane Smith"
                  value={form.parent_name}
                  onChange={(e) => setForm((f) => ({ ...f, parent_name: e.target.value }))}
                  className={inputClass}
                  style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
                />
              </div>
              <div>
                <label htmlFor="parent_email" className={labelClass}>
                  Your email
                </label>
                <input
                  id="parent_email"
                  type="email"
                  required
                  placeholder="jane@example.com"
                  value={form.parent_email}
                  onChange={(e) => setForm((f) => ({ ...f, parent_email: e.target.value }))}
                  className={inputClass}
                  style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="student_grade" className={labelClass}>
                Student&rsquo;s current grade
              </label>
              <select
                id="student_grade"
                required
                value={form.student_grade}
                onChange={(e) => setForm((f) => ({ ...f, student_grade: e.target.value }))}
                className={inputClass}
                style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
              >
                <option value="" disabled>Select a grade</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="schools" className={labelClass}>
                Current school &amp; target schools
              </label>
              <input
                id="schools"
                type="text"
                required
                placeholder="e.g. Exeter → Harvard, Yale, Princeton"
                value={form.schools}
                onChange={(e) => setForm((f) => ({ ...f, schools: e.target.value }))}
                className={inputClass}
                style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
              />
            </div>

            <div>
              <label htmlFor="essay_context" className={labelClass}>
                What you&rsquo;d like to discuss
              </label>
              <textarea
                id="essay_context"
                required
                rows={4}
                placeholder="Tell us where your student is in the process and what's on their mind. The more specific, the more valuable the session."
                value={form.essay_context}
                onChange={(e) => setForm((f) => ({ ...f, essay_context: e.target.value }))}
                className={`${inputClass} resize-none`}
                style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
              />
            </div>
          </div>
        </section>

        {/* ── Submit ──────────────────────────────────────────────────────────── */}
        {submitError && (
          <p className="text-sm text-red-600">{submitError}</p>
        )}

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={!formIsValid || submitting}
            aria-label={`Book a session with ${teacher.name}`}
            className="inline-flex items-center rounded-[3px] bg-[#2C4A3E] px-8 py-3.5 text-sm font-medium text-white hover:bg-[#3A6054] disabled:opacity-40 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40"
            style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
          >
            {submitting ? "Redirecting to checkout…" : `Book & pay $${sessionPrice} →`}
          </button>
          <p
            className="text-xs text-[#1A2E26]/40"
            style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
          >
            Secure checkout via Stripe
          </p>
        </div>
      </form>
    </div>
  );
}

export default function TeacherBookPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <Suspense
        fallback={
          <div className="mx-auto max-w-2xl px-6 py-20 text-center">
            <p
              className="text-sm text-[#1A2E26]/50"
              style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
            >
              Loading&hellip;
            </p>
          </div>
        }
      >
        <TeacherBookingContent slug={slug} />
      </Suspense>
    </main>
  );
}

"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  "4th Grade",
  "5th Grade",
  "6th Grade",
  "7th Grade",
  "8th Grade",
  "9th Grade",
  "10th Grade",
  "11th Grade",
  "12th Grade",
  "Gap Year",
  "College Student",
];

// ── Formatting helpers ────────────────────────────────────────────────────────

function formatDateHeader(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(isoString));
}

function formatTime(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoString));
}

function formatFullDateTime(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(isoString));
}

// Group slots by calendar date (ET)
function groupSlotsByDate(slots: Slot[]): SlotsByDate {
  const groups: SlotsByDate = {};
  for (const slot of slots) {
    const dateKey = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(slot.datetime));
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(slot);
  }
  return groups;
}

// ── Component ─────────────────────────────────────────────────────────────────

function ConsultationBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wasCancelled = searchParams.get("cancelled") === "1";

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState<FormData>({
    parent_name: "",
    parent_email: "",
    student_grade: "",
    schools: "",
    essay_context: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch available slots
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/book/slots?offering_type=consultation");
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
  }, []);

  const slotsByDate = groupSlotsByDate(slots);
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
    if (!formIsValid || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/book/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availability_id: selectedSlot!.id,
          ...form,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSubmitError(json.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      // Redirect to Stripe Checkout
      router.push(json.url);
    } catch {
      setSubmitError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20 md:py-28">
      {/* Back link */}
      <Link
        href="/academy/book"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
      >
        <span aria-hidden="true">←</span> All offerings
      </Link>

      {/* Cancelled notice */}
      {wasCancelled && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
          Your checkout was cancelled. No charge was made. Please select a time to try again.
        </div>
      )}

      {/* Header */}
      <div className="mt-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
          Parent Consultation
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.15] tracking-tight text-zinc-950 sm:text-5xl">
          Book your session.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-zinc-500">
          1 hour with Sam Ahn &mdash; <strong className="font-semibold text-zinc-700">$500</strong>.
          Select a time, tell us about your student, and pay to confirm.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-14 space-y-12">

        {/* ── Step 1: Select a time ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-bold tracking-[0.18em] text-zinc-300 uppercase">01</span>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
              Choose a time
            </h2>
          </div>
          <p className="mt-1 ml-8 text-sm text-zinc-400">All times shown in Eastern Time (ET).</p>

          <div className="mt-6 ml-8">
            {slotsLoading && (
              <p className="text-base text-zinc-400">Loading available times&hellip;</p>
            )}
            {slotsError && (
              <p className="text-base text-red-600">{slotsError}</p>
            )}
            {!slotsLoading && !slotsError && slots.length === 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
                <p className="text-base text-zinc-500">
                  No times are available right now. Check back soon, or{" "}
                  <a href="/contact" className="underline underline-offset-2 hover:text-zinc-900">
                    get in touch
                  </a>
                  .
                </p>
              </div>
            )}

            {!slotsLoading && !slotsError && slots.length > 0 && (
              <div className="space-y-8">
                {sortedDateKeys.map((dateKey) => (
                  <div key={dateKey}>
                    <p className="mb-3 text-sm font-semibold text-zinc-500">
                      {formatDateHeader(slotsByDate[dateKey][0].datetime)}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {slotsByDate[dateKey].map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-all ${
                            selectedSlot?.id === slot.id
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
                          }`}
                        >
                          {formatTime(slot.datetime)} ET
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedSlot && (
              <p className="mt-4 text-sm text-emerald-700 font-medium">
                ✓ Selected: {formatFullDateTime(selectedSlot.datetime)}
              </p>
            )}
          </div>
        </section>

        {/* ── Step 2: Intake form ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-bold tracking-[0.18em] text-zinc-300 uppercase">02</span>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
              Tell us about your student
            </h2>
          </div>

          <div className="mt-6 ml-8 space-y-5">
            {/* Parent name + email */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Your name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jane Smith"
                  value={form.parent_name}
                  onChange={(e) => setForm((f) => ({ ...f, parent_name: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 placeholder-zinc-300 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Your email
                </label>
                <input
                  type="email"
                  required
                  placeholder="jane@example.com"
                  value={form.parent_email}
                  onChange={(e) => setForm((f) => ({ ...f, parent_email: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 placeholder-zinc-300 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition"
                />
              </div>
            </div>

            {/* Grade */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Student&rsquo;s current grade
              </label>
              <select
                required
                value={form.student_grade}
                onChange={(e) => setForm((f) => ({ ...f, student_grade: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition appearance-none"
              >
                <option value="" disabled>
                  Select a grade
                </option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Schools */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Current school &amp; target schools
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Exeter → Harvard, Yale, Princeton"
                value={form.schools}
                onChange={(e) => setForm((f) => ({ ...f, schools: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 placeholder-zinc-300 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition"
              />
            </div>

            {/* Essay context */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Where is your student in the process?
              </label>
              <p className="text-xs text-zinc-400 mb-2">
                Tell us whatever is relevant — their essay ideas, what they&rsquo;ve written so far,
                what they&rsquo;re struggling with, or what you most want to discuss.
              </p>
              <textarea
                required
                rows={5}
                placeholder="My daughter is a junior who's been writing about her violin, but it feels generic. She's also done a lot of community work that might be more interesting…"
                value={form.essay_context}
                onChange={(e) => setForm((f) => ({ ...f, essay_context: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 placeholder-zinc-300 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition resize-y"
              />
            </div>
          </div>
        </section>

        {/* ── Submit ────────────────────────────────────────────────────────── */}
        <section className="ml-8">
          {submitError && (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </p>
          )}

          {selectedSlot && (
            <div className="mb-6 rounded-2xl border border-zinc-100 bg-white p-6">
              <p className="text-sm text-zinc-500">Booking summary</p>
              <p className="mt-1.5 font-semibold text-zinc-900">Parent Consultation · 1 hour</p>
              <p className="text-sm text-zinc-500">{formatFullDateTime(selectedSlot.datetime)}</p>
              <p className="mt-3 text-xl font-semibold text-zinc-950">$500</p>
              <p className="text-xs text-zinc-400">Card or ACH bank transfer accepted at checkout.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!formIsValid || submitting}
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-8 py-4 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? "Redirecting to checkout…" : "Continue to payment →"}
          </button>

          <p className="mt-4 text-xs text-zinc-400">
            You&rsquo;ll be taken to a secure Stripe checkout page to complete your payment.
            Your slot is held for the duration of your checkout session.
          </p>
        </section>

      </form>
    </div>
  );
}

export default function ConsultationBookingPage() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-3xl px-6 py-20 text-zinc-400">Loading…</div>}>
      <ConsultationBookingContent />
    </Suspense>
  );
}

"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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

function SprintBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wasCancelled = searchParams.get("cancelled") === "1";

  const [form, setForm] = useState<FormData>({
    parent_name: "",
    parent_email: "",
    student_grade: "",
    schools: "",
    essay_context: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formIsValid =
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
          offering_type: "sprint",
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

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20 md:py-28">
      {/* Back link */}
      <Link
        href="/academy/pricing"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
      >
        <span aria-hidden="true">←</span> All offerings
      </Link>

      {/* Cancelled notice */}
      {wasCancelled && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
          Your checkout was cancelled. No charge was made. Please try again.
        </div>
      )}

      {/* Header */}
      <div className="mt-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
          Common App Sprint
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.15] tracking-tight text-zinc-950 sm:text-5xl">
          Tell us about your student.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-zinc-500">
          <strong className="font-semibold text-zinc-700">$10,000</strong>.
          Fill out the form below and pay to confirm your enrollment.
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Prices in USD. International cards accepted.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-14 space-y-5">

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
            what they&rsquo;re struggling with, or what you most want to accomplish together.
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

        {/* Submit */}
        <div className="pt-4">
          {submitError && (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </p>
          )}

          <div className="mb-6 rounded-2xl border border-zinc-100 bg-white p-6">
            <p className="text-sm text-zinc-500">Booking summary</p>
            <p className="mt-1.5 font-semibold text-zinc-900">Common App Sprint</p>
            <p className="mt-3 text-xl font-semibold text-zinc-950">$10,000 USD</p>
            <p className="text-xs text-zinc-400">
              Card, ACH, Alipay, WeChat Pay, and Link accepted at checkout.
            </p>
          </div>

          <button
            type="submit"
            disabled={!formIsValid || submitting}
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-8 py-4 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? "Redirecting to checkout…" : "Continue to payment →"}
          </button>

          <p className="mt-4 text-xs text-zinc-400">
            You&rsquo;ll be taken to a secure Stripe checkout page to complete your payment.
          </p>
        </div>

      </form>
    </div>
  );
}

export default function SprintBookingPage() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-3xl px-6 py-20 text-zinc-400">Loading…</div>}>
      <SprintBookingContent />
    </Suspense>
  );
}

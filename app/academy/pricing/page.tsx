import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — StoryLab",
  description: "Book a StoryLab offering.",
};

const gridOfferings = [
  {
    id: "consultation",
    status: "live" as const,
    label: "Available now",
    title: "Parent Consultation",
    price: "$500",
    duration: "1 hour",
    description:
      "A focused strategy session for parents. We'll map where your student stands, what their application narrative should be, and exactly what needs to happen next.",
    cta: "Book a consultation",
    href: "/academy/pricing/consultation",
  },
  {
    id: "bootcamp",
    status: "coming-soon" as const,
    label: "Coming soon",
    title: "Common App Bootcamp",
    price: null,
    duration: null,
    description:
      "An intensive, structured program for rising seniors to build and complete their Common App essays with direct coaching from the StoryLab team.",
    cta: null,
    href: null,
  },
];

const sprintDeliverables = [
  "Main Common App essay — multiple rounds of revision",
  "3–4 supplemental essays",
  "Activities list review",
];

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-20 md:py-28">
      {/* Back link */}
      <Link
        href="/academy"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
      >
        <span aria-hidden="true">←</span> Back to StoryLab
      </Link>

      {/* Header */}
      <div className="mt-10 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
          Pricing
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.15] tracking-tight text-zinc-950 sm:text-5xl">
          Where would you like to start?
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-zinc-500">
          Every StoryLab engagement begins with a conversation. Choose the offering that fits your
          student&rsquo;s stage and timeline.
        </p>
      </div>

      {/* Top grid: Consultation + Bootcamp */}
      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {gridOfferings.map((o) => (
          <div
            key={o.id}
            className={`flex flex-col rounded-2xl border p-8 transition-all ${
              o.status === "live"
                ? "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-lg"
                : "border-zinc-100 bg-zinc-50/60"
            }`}
          >
            {/* Badge */}
            <span
              className={`self-start rounded-full px-3 py-1 text-xs font-medium ${
                o.status === "live"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-zinc-200 bg-zinc-100 text-zinc-400"
              }`}
            >
              {o.label}
            </span>

            {/* Title + price */}
            <div className="mt-5 flex items-start justify-between gap-4">
              <h2
                className={`text-xl font-semibold tracking-tight ${
                  o.status === "live" ? "text-zinc-950" : "text-zinc-400"
                }`}
              >
                {o.title}
              </h2>
              {o.price && (
                <span className="flex-shrink-0 text-xl font-semibold text-zinc-950">
                  {o.price}
                </span>
              )}
            </div>

            {o.duration && (
              <p className="mt-1 text-sm text-zinc-400">{o.duration}</p>
            )}

            <p
              className={`mt-4 flex-1 text-base leading-relaxed ${
                o.status === "live" ? "text-zinc-600" : "text-zinc-400"
              }`}
            >
              {o.description}
            </p>

            <div className="mt-8">
              {o.status === "live" && o.href ? (
                <Link
                  href={o.href}
                  className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
                >
                  {o.cta}
                </Link>
              ) : (
                <p className="text-sm font-medium text-zinc-400">Notify me when available →</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Common App Sprint — featured full-width card */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:border-zinc-300 hover:shadow-lg sm:p-10">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:gap-12">

          {/* Left: text */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-3">
              <span className="self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Rolling enrollment
              </span>
            </div>

            <div className="mt-5 flex items-start justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
                Common App Sprint
              </h2>
              <span className="flex-shrink-0 text-xl font-semibold text-zinc-950">$10,000</span>
            </div>

            <p className="mt-4 text-base leading-relaxed text-zinc-600">
              One-on-one access to Sam&rsquo;s editorial eye — without a full-year commitment.
              A defined-timeline intensive for students who are ready to do the work and want the
              best possible version of every word they submit.
            </p>

            <div className="mt-8">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
              >
                Get in touch →
              </Link>
            </div>
          </div>

          {/* Right: deliverables */}
          <div className="md:w-60 lg:w-72">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              What&rsquo;s included
            </p>
            <ul className="mt-4 space-y-3">
              {sprintDeliverables.map((d) => (
                <li key={d} className="flex items-start gap-3 text-sm leading-relaxed text-zinc-600">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                  {d}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Concierge note */}
      <div className="mt-6 rounded-2xl border border-zinc-100 bg-white/60 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
          Concierge Service
        </p>
        <h3 className="mt-3 text-xl font-semibold tracking-tight text-zinc-950">
          Looking for full-service, start-to-finish guidance?
        </h3>
        <p className="mt-3 text-base leading-relaxed text-zinc-600">
          The StoryLab Concierge is our most comprehensive offering — a deeply personal,
          months-long engagement that covers every facet of the application. It isn&rsquo;t
          self-serve. Start with a consultation to discuss fit.
        </p>
        <Link
          href="/contact"
          className="mt-5 inline-flex items-center text-sm font-medium text-zinc-700 hover:text-zinc-950 transition-colors"
        >
          Get in touch →
        </Link>
      </div>
    </div>
  );
}

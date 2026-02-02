import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Academy",
  description:
    "StoryLab Academy offers three paths: Humanities Foundations for middle and high school, College Applications, and Transfer Applications.",
};

const programs = [
  {
    href: "/academy/humanities",
    title: "Humanities Foundations",
    grades: "7th-11th grade",
    description:
      "Middle school through high school. Reading, analytical writing, thinking, and intellectual voice. The skills that compound over years and make strong college essays possible.",
  },
  {
    href: "/academy/applications",
    title: "College Applications",
    grades: "11th-12th grade",
    description:
      "Personal statements, supplements, positioning. We help students apply the foundation they've built to tell their story clearly and authentically.",
  },
  {
    href: "/academy/transfer",
    title: "Transfer Applications",
    grades: "Current university students",
    description:
      "For students transferring from another university to a more selective one. We help craft a compelling narrative around your academic journey and growth.",
  },
];

export default function AcademyPage() {
  return (
    <div className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl bg-paper/92 px-6 py-16 sm:py-20">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
            Academy
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
            Three paths. One foundation.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-700">
            Humanities foundations build the skills. College and transfer applications put them to use.
          </p>
        </header>

        <section className="mt-14 grid gap-6 md:grid-cols-3">
          {programs.map((program) => (
            <Link
              key={program.href}
              href={program.href}
              className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
            >
              <h2 className="text-xl font-semibold tracking-tight text-zinc-950 group-hover:text-zinc-700">
                {program.title}
              </h2>
              <p className="mt-1 text-sm font-medium text-zinc-500">
                {program.grades}
              </p>
              <p className="mt-4 flex-1 text-base leading-relaxed text-zinc-600">
                {program.description}
              </p>
              <span className="mt-6 inline-flex items-center text-sm font-medium text-zinc-900 group-hover:text-zinc-700">
                Learn more
                <svg
                  className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
            </Link>
          ))}
        </section>

        <section className="mt-14 rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Not sure which path is right?
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600">
            We'll help you figure out the best fit based on your timeline, goals, and current situation.
          </p>
          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              Get started
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

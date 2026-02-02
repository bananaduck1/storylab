import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

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
    features: [
      {
        t: "Reading and analysis",
        d: "Close reading, critical thinking, and analytical writing skills that compound over time.",
      },
      {
        t: "Intellectual voice",
        d: "Students learn to think and write with clarity and originality, developing their voice naturally.",
      },
      {
        t: "Writing workshops",
        d: "Structured practice in analytical and creative writing, with consistent feedback from trained tutors.",
      },
      {
        t: "Early preparation",
        d: "Starting in middle school or early high school builds skills that make strong college essays possible.",
      },
    ],
  },
  {
    href: "/academy/applications",
    title: "College Applications",
    grades: "11th-12th grade",
    description:
      "Personal statements, supplements, positioning. We help students apply the foundation they've built to tell their story clearly and authentically.",
    features: [
      {
        t: "Personal statements",
        d: "Main essay development and editing, applying the writing skills students have built.",
      },
      {
        t: "Supplements",
        d: "School-specific essays and short answers, with clear positioning and authentic voice.",
      },
      {
        t: "Strategy and positioning",
        d: "Application narrative, school list logic, and a plan that respects the student's authentic story.",
      },
      {
        t: "Full application support",
        d: "Comprehensive guidance for students who want end-to-end support through the application process.",
      },
    ],
  },
  {
    href: "/academy/transfer",
    title: "Transfer Applications",
    grades: "Current university students",
    description:
      "For students transferring from another university to a more selective one. We help craft a compelling narrative around your academic journey and growth.",
    features: [
      {
        t: "Transfer narrative",
        d: "Why you want to transfer and why now. We help you articulate your academic and personal growth.",
      },
      {
        t: "Academic fit",
        d: "How your goals align with the target school. We help you research programs and demonstrate genuine interest.",
      },
      {
        t: "College experience",
        d: "What you've learned and accomplished. We help you present your time at your current school positively.",
      },
      {
        t: "Application strategy",
        d: "School selection and positioning. We help you target schools where you're a strong fit.",
      },
    ],
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
            Choose the path that matches your student's timeline and goals.
          </p>
        </header>

        <section className="mt-14 grid gap-6 lg:grid-cols-3">
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

        {programs.map((program, idx) => (
          <section key={program.href} className="mt-14">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
              {program.title} ({program.grades})
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {program.features.map((f) => (
                <div key={f.t} className="rounded-2xl border border-zinc-200 bg-white p-6">
                  <h3 className="text-lg font-semibold tracking-tight text-zinc-950">{f.t}</h3>
                  <p className="mt-3 text-base leading-relaxed text-zinc-600">{f.d}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-14 grid gap-8 lg:grid-cols-[1fr_auto] lg:gap-12 lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Why humanities
            </h2>
            <div className="mt-6 max-w-3xl space-y-4 text-base leading-relaxed text-zinc-600">
              <p>
                In a world increasingly shaped by technology, what people crave most is meaning.
              </p>
              <p>
                Tools change quickly. Human needs do not. We still gather around stories — in
                books, films, television, and music — because storytelling is how we understand
                ourselves and each other. The medium evolves; the impulse does not.
              </p>
              <p>
                Universities recognize this. Many admissions officers are trained in the humanities,
                and they respond to writing that shows judgment, voice, and interpretive skill — not
                just technical proficiency.
              </p>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <Image
              src="/photo-4.png"
              alt=""
              width={400}
              height={400}
              className="h-auto w-full max-w-sm rounded-lg object-cover shadow-md border border-line/30"
            />
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Not sure which path is right?
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600">
            Share your student's grade level, timeline, and goals. We'll respond with an honest
            read on which program fits best.
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

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "StoryLab programs: Humanities Foundations for middle and high school, and College Applications support for 11th and 12th graders.",
};

export default function ServicesPage() {
  return (
    <div className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl bg-paper/92 px-6 py-16 sm:py-20">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
            Programs
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
            Two paths. One foundation.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-700">
            Humanities foundations build the skills. College applications put them to use. Choose
            the path that matches your student's timeline and goals.
          </p>
        </header>

        <section className="mt-12 space-y-10">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
              Humanities Foundations (7th-11th grade)
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {[
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
              ].map((c) => (
                <div key={c.t} className="rounded-2xl border border-zinc-200 bg-white p-6">
                  <h2 className="text-lg font-semibold tracking-tight text-zinc-950">{c.t}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">{c.d}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
              College Applications (12th grade)
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {[
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
              ].map((c) => (
                <div key={c.t} className="rounded-2xl border border-zinc-200 bg-white p-6">
                  <h2 className="text-lg font-semibold tracking-tight text-zinc-950">{c.t}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Ready to get started?
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Share your student's grade level, timeline, and goals. We'll respond with an honest
            read on which program fits best.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              Contact
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

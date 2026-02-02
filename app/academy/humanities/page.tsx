import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Humanities Foundations",
  description:
    "Build reading, writing, and thinking skills that compound over years. For students in 7th-11th grade.",
};

export default function HumanitiesPage() {
  return (
    <div className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl bg-paper/92 px-6 py-16 sm:py-20">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
            Academy
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
            Humanities Foundations
          </h1>
          <p className="mt-2 text-lg font-medium text-zinc-700">
            7th-11th grade
          </p>
          <p className="mt-6 text-lg leading-relaxed text-zinc-700">
            Reading, analytical writing, thinking, and intellectual voice. The skills that
            compound over years and make strong college essays possible.
          </p>
        </header>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            What students learn
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Close reading",
                description:
                  "How to read carefully, identify arguments, and engage critically with complex texts.",
              },
              {
                title: "Analytical writing",
                description:
                  "How to structure arguments, support claims with evidence, and write with clarity.",
              },
              {
                title: "Critical thinking",
                description:
                  "How to question assumptions, evaluate sources, and form independent judgments.",
              },
              {
                title: "Intellectual voice",
                description:
                  "How to develop a distinctive perspective and communicate it authentically.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6"
              >
                <h3 className="text-lg font-semibold tracking-tight text-zinc-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Why start early
          </h2>
          <div className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-zinc-600">
            <p>
              Reading and writing are skills that compound. Students who start in middle school
              develop intellectual habits that become second nature by the time they write
              college essays.
            </p>
            <p>
              The goal isn't to prepare for a specific test or application. It's to build the
              foundation that makes everything else easier: school assignments, standardized
              tests, and eventually college applications.
            </p>
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Ready to start?
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
            We'll assess current skills and create a plan that matches your student's timeline
            and goals.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              Get started
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              Back to home
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

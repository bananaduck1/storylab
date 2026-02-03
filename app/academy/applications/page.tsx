import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "College Applications",
  description:
    "Personal statements, supplements, and positioning. For students in 11th-12th grade applying to selective universities.",
};

export default function ApplicationsPage() {
  return (
    <div className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl bg-paper/92 px-6 py-16 sm:py-20">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
            Academy
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
            College Applications
          </h1>
          <p className="mt-2 text-lg font-medium text-zinc-700">
            11th-12th grade
          </p>
          <p className="mt-6 text-lg leading-relaxed text-zinc-700">
            Personal statements, supplements, positioning. We help students apply the foundation
            they've built to tell their story clearly and authentically.
          </p>
        </header>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            What we work on
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Personal statement",
                description:
                  "The Common App essay that introduces you to admissions. We help you find and tell your story.",
              },
              {
                title: "Supplemental essays",
                description:
                  "School-specific essays that show fit and interest. We help you research and respond authentically.",
              },
              {
                title: "Application strategy",
                description:
                  "School list, positioning, and narrative coherence. We help you present a clear picture.",
              },
              {
                title: "Interview preparation",
                description:
                  "How to talk about yourself and your interests. We help you practice and refine your answers.",
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
            Our philosophy
          </h2>
          <div className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-zinc-600">
            <p>
              Reading, writing, and thinking are skills that compound. The best college essays
              aren't written in a month—they're built over years of practice. Students who start
              early develop intellectual voice naturally.
            </p>
            <p>
              In an AI-saturated era, the only real moat is human voice and original thinking.
              We keep writing unmistakably human—original thought, specific images, and calm
              structure over tech tricks or fear.
            </p>
            <p>
              Strategy = empathy for the reader + ruthless specificity. No invented stats. No
              pressure tactics. Just clear thinking and careful teaching.
            </p>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Our approach
          </h2>
          <div className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-zinc-600">
            <p>
              We don't write essays for students. We help them discover what they want to say
              and teach them how to say it clearly.
            </p>
            <p>
              The best essays come from students who have something real to communicate.
              Our job is to help them find it and express it in their own voice.
            </p>
            <p>
              Students who've built humanities foundations have an advantage here. They've
              already developed the thinking and writing skills that make strong essays possible.
            </p>
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Ready to start?
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
            We'll discuss your timeline, school list, and goals to create a plan that works
            for you.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              Get started
            </Link>
            <Link
              href="/academy"
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              Back to Academy
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

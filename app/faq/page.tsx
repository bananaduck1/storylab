import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "FAQ for StoryLab—answers about our humanities training and college applications programs.",
};

export default function FAQPage() {
  const faqs: Array<{ q: string; a: ReactNode }> = [
    {
      q: "What makes StoryLab different?",
      a: "StoryLab tutors are trained humanities graduates admitted to multiple top universities, all using the same pedagogy. We focus on building reading, writing, and thinking skills that compound over time, not just last-minute essay editing.",
    },
    {
      q: "Do tutors work directly with students or mostly with parents?",
      a: "Tutors work directly with students and loop parents in as appropriate. Transparency and alignment matter for the whole family.",
    },
    {
      q: "How do you think about AI tools like ChatGPT?",
      a: "AI can help at the surface level, but when everyone uses the same tools, everyone sounds the same. Essays work when they feel lived-in and personal, not optimized. We teach students to develop their own voice and thinking.",
    },
    {
      q: "Do you guarantee outcomes?",
      a: "No one can guarantee admissions results. What we guarantee is thoughtful teaching that helps students build reading, writing, and thinking skills—skills that serve them in college and beyond.",
    },
    {
      q: "When is the right time to start?",
      a: "For humanities foundations, as early as middle school. Skills compound over time. For college applications, typically 11th or 12th grade. Earlier work lets students develop their voice over time instead of trying to manufacture depth during senior year.",
    },
    {
      q: "How hands-on are tutors with student work?",
      a: "It depends on the program. Tutors provide consistent feedback—teaching carefully while preserving and developing the student's voice. All tutors use the same StoryLab method.",
    },
  ];

  return (
    <div className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl bg-paper/92 px-6 py-16 sm:py-20">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
            FAQ
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
            Clear answers. No haze.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-700">
            If you're deciding whether StoryLab is a fit, start here.
          </p>
        </header>

        <section className="mt-12">
          <div className="grid gap-4">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-zinc-200 bg-white p-6"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-950 outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30">
                  <span className="mr-2 inline-block align-middle text-zinc-400 group-open:rotate-90">
                    ▸
                  </span>
                  {f.q}
                </summary>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-600">{f.a}</div>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Still unsure?
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
            We'll clarify what you actually need—then decide if StoryLab is the right fit.
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

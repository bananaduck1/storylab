import Image from "next/image";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "FAQ for Ivy StoryLab, answered by Sam—student-first, calm, and honest.",
};

export default function FAQPage() {
  const faqs: Array<{ q: string; a: ReactNode }> = [
    {
      q: "How did you get into Harvard, Yale, Princeton, and Stanford?",
      a: (
        <div className="space-y-4">
          <p>I genuinely loved writing my college essays.</p>

          <p>
            Many students approach the application process with anxiety, but I saw it as a rare
            opportunity: a chance to tell my own story, on my own terms. I leaned into that freedom.
          </p>

          <p>
            Strong essays will never guarantee admission—but they can make the difference between
            being skimmed and being remembered. One of my admissions officers wrote me a personal
            note singling out my essays as a deciding factor in my admission. I was also the first
            student from my high school in years to be admitted to Stanford without legacy.
          </p>

          <div className="mt-4 flex justify-center">
            <Image
              src="/stanford-admissions-note.jpg"
              alt="Stanford admissions officer note"
              width={1200}
              height={800}
              className="h-auto w-full max-w-sm object-contain"
              priority
            />
          </div>
        </div>
      ),
    },
    {
      q: "Do you work directly with students or mostly with parents?",
      a: "I work directly with students and loop parents in as appropriate. Transparency and alignment matter for the whole family.",
    },
    {
      q: "How do you think about AI tools like ChatGPT?",
      a: "AI can help at the surface level, but when everyone uses the same tools, everyone sounds the same. Essays work when they feel lived-in and personal, not optimized.",
    },
    {
      q: "Do you guarantee outcomes?",
      a: "No one can guarantee admissions results. What I guarantee is thoughtful, well-written essays that help students find and articulate their voice.",
    },
    {
      q: "When is the right time to start working together?",
      a: "As early as possible. Earlier work lets students develop their voice over time instead of trying to manufacture depth during senior year.",
    },
    {
      q: "How hands-on are you with essays?",
      a: "It depends on the package. I’m meticulous with feedback—editing carefully while preserving the student’s voice.",
    },
  ];

  return (
    <div className="bg-stone-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
            FAQ
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
            Clear answers. No haze.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-700">
            If you’re deciding whether coaching is worth it, start here.
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
            Still unsure? Start with a call.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
            We’ll clarify what you actually need—then decide if coaching is the right move.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="https://calendly.com/your-calendly-link"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              Book a free consult
            </a>
            <a
              href="mailto:sam@yourdomain.com"
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              Email Sam
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}


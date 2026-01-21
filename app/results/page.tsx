import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Results",
  description:
    "Testimonials for Ivy StoryLab—honest notes from students and families. No invented stats or guarantees.",
};

export default function ResultsPage() {
  return (
    <div className="bg-stone-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
            Results
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
            Clear work. Honest boundaries.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-700">
            No invented stats or guarantees. Just notes from students and parents.
          </p>
        </header>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            {
              q: "“What stood out most was Sam’s genuine sense of care. Our meetings were effective and motivating, and having a real game plan made the entire process far less stressful—for both me and my mom.”",
              a: "Student admitted to Vanderbilt ’29",
            },
            {
              q: "“Sam told me honestly when a draft felt cheesy and pushed me to rewrite it into something more sincere. He taught me to write logically and authentically, without over-flexing, and helped me discover what actually made my story unique.”",
              a: "Student admitted to Northwestern ’28",
            },
            {
              q: "“For families who want their student remembered, not summarized.”",
              a: "Family note",
            },
          ].map((t) => (
            <figure
              key={t.q}
              className="rounded-2xl border border-zinc-200 bg-white p-6"
            >
              <blockquote className="text-sm leading-relaxed text-zinc-700">
                {t.q}
              </blockquote>
              <figcaption className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                {t.a}
              </figcaption>
            </figure>
          ))}
        </section>

        <section className="mt-14 rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Want to talk through your situation?
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Start with a free consult. We’ll clarify what support would help—and what
            would be unnecessary.
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


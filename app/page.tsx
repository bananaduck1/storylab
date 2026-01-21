import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Admissions coaching that keeps essays radically personal, reader-aware, and rigorously clear—without hype.",
};

export default function Home() {
  return (
    <div className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-6 bg-paper/90 backdrop-blur-[1px]">
        {/* Hero */}
        <section className="py-16 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
            StoryLab
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-zinc-950 sm:text-5xl">
            Helping students develop a<br />
            voice worth reading.
          </h1>
          <div className="mt-6 max-w-2xl space-y-3 text-lg leading-relaxed text-zinc-700">
            <p>Hi, I’m Sam. In 2020, I was admitted to Yale, Harvard, Stanford, and Princeton.</p>
            <p>
              I chose Yale, studied creative writing, graduated magna cum laude and Phi Beta Kappa,
              won university writing prizes, and worked at the Yale Admissions Office as
              an interviewer.
            </p>
            <p>
              I now coach a small number of students. Essays stay radically personal: clear strategy,
              gentle rigor, and a voice that still sounds like you.
            </p>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="mailto:storylab.ivy@gmail.com"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm shadow-zinc-900/15 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              Email Sam
            </a>
          </div>
        </section>

        {/* Approach / Credibility */}
        <section className="border-t border-zinc-200/70 py-14 sm:py-16">
          <div className="grid gap-10 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-5">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                Warm, incisive, honest.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                Strategy = empathy for the reader + ruthless specificity. No invented stats.
                No pressure tactics. Just clear thinking and careful edits.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                In an AI-saturated era, the only real moat is a human voice. We keep writing
                unmistakably yours—original thought, specific images, and calm structure over tech
                tricks or fear.
              </p>
            </div>
            <div className="md:col-span-7">
              <dl className="grid gap-4 sm:grid-cols-3">
                {[
                  { k: "Radically personal", v: "Most applications blur because they optimize for impressive instead of radically personal." },
                  { k: "Reader empathy", v: "Readers are tired humans with taste. Write for someone wanting to go on lunch break, not a rubric." },
                  { k: "Calm rigor", v: "High standards, low drama, every line doing work. Your essay is a story that should entertain." },
                ].map((item) => (
                  <div
                    key={item.k}
                    className="rounded-2xl border border-zinc-200 bg-white p-5"
                  >
                    <dt className="text-sm font-semibold text-zinc-950">{item.k}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-zinc-600">
                      {item.v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Services preview */}
        <section className="border-t border-zinc-200/70 py-14 sm:py-16">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                Services
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
                Take what serves your bandwidth. Strategy, essay craft, or a final hard edit.
              </p>
            </div>
            <a
              href="/services"
              className="text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-700"
            >
              View all services
            </a>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                t: "Strategy + positioning",
                d: "Narrative spine, school logic, and a plan that respects your time.",
              },
              {
                t: "Essay development",
                d: "From blank page to clean draft—structure first, then voice and line-level craft.",
              },
              {
                t: "Review + refinement",
                d: "Targeted review for existing drafts that need clear, human edits.",
              },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-zinc-200 bg-white p-6">
                <h3 className="text-lg font-semibold tracking-tight text-zinc-950">
                  {c.t}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{c.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials preview (placeholders) */}
        <section className="border-t border-zinc-200/70 py-14 sm:py-16">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                What families say
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
                A few notes from students and parents.
              </p>
            </div>
            <a
              href="/results"
              className="text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-700"
            >
              Read more
            </a>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
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
                q: "“My other counselor has plenty of clients and experience, but it was only when I started working with Sam that my essays finally felt like mine.”",
                a: "Student admitted to UChicago '30",
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
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-zinc-200/70 py-16 sm:py-20">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
              For families who want their student remembered, not summarized.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Thoughtful guidance for a noisy process.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="mailto:storylab.ivy@gmail.com"
                className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm shadow-zinc-900/15 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
              >
                Email Sam
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

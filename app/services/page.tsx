import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Admissions coaching services for Ivy StoryLab: focused support for 12th graders and early advising that keeps essays human and specific.",
};

export default function ServicesPage() {
  return (
    <div className="bg-stone-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
            Services
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
            Support that stays human.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-700">
            Choose the level that fits your bandwidth. No invented outcomes—just clear thinking,
            close reads, and steady edits.
          </p>
        </header>

        <section className="mt-12 space-y-10">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
              For 12th Graders
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  t: "Common App Bootcamp",
                  d: "A focused sprint to draft, edit, and ready the core application without losing voice.",
                },
                {
                  t: "Essay Concierge Service",
                  d: "Hands-on outlining, drafting, and line edits for personal statement and supplements.",
                },
                {
                  t: "Mock Interviews",
                  d: "Calm, candid practice that favors clarity and presence over rehearsed talking points.",
                },
                {
                  t: "Full Package",
                  d: "Comprehensive strategy plus full essay editing for students who want end-to-end support.",
                },
                {
                  t: "Group Classes",
                  d: "Small, live sessions with tight feedback loops to keep work moving between meetings.",
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
              Pre-12th Grade Advising
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 md:col-span-2">
                <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
                  Early, thoughtful guidance
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-600">
                  <p>
                    I strongly recommend working together before senior year—sometimes as early as
                    eighth grade. By 12th grade, many students are locked into narratives that don’t
                    fully reflect who they are.
                  </p>
                  <p>
                    Earlier guidance lets students grow organically into strong applicants, instead
                    of retrofitting meaning at the last minute. My role isn’t to manufacture
                    accomplishments, but to help make thoughtful choices over time—choices that lead
                    to clearer, more authentic applications when it counts.
                  </p>
                  <p>
                    We also workshop prize and competition essays as skill-building: sharpening
                    clarity, originality, and structure—never as résumé padding.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Email to discuss fit
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Share your grade level, timeline, and goals. I’ll respond with an honest read on fit.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="mailto:storylab.ivy@gmail.com"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              Email Sam
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}


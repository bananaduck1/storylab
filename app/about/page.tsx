import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Ivy StoryLab: warm, incisive admissions coaching that keeps essays radically personal, readable, and calm.",
};

export default function AboutPage() {
  return (
    <div className="bg-stone-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
            About
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
            Craft, plus calm judgment.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-700">
            Hi, I’m Sam. In 2020, I was admitted to Yale, Harvard, Stanford, and Princeton. I chose
            Yale, studied the humanities, graduated magna cum laude and Phi Beta Kappa with
            Distinction, won university writing prizes, and later interviewed applicants for Yale.
            I now work closely with a small number of students so their essays stay unmistakably
            human.
          </p>
        </header>

        <section className="mt-12 grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-7">
            <div className="rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                An editorial, human process
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                Many families arrive after hearing advice that sounds polished but interchangeable.
                Much of it relies on formulas—how to frame achievements, how to sound “impressive.”
                That approach misses what matters.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                I edit essays the way an admissions reader scans: does the person on the page feel
                real, specific, and compelling enough to live and learn alongside others? I don’t
                run a volume shop or outsource reading. Select clients, close reads, honest notes.
              </p>
            </div>
          </div>
          <aside className="md:col-span-5">
            <div className="rounded-3xl border border-zinc-200 bg-white p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
                Values
              </p>
              <ul className="mt-5 space-y-4 text-sm text-zinc-700">
                {[
                  {
                    t: "Clarity over cleverness",
                    d: "Readable beats performative. If it’s clear, it can be trusted.",
                  },
                  {
                    t: "Voice over polish",
                    d: "Editing should reveal the student, not replace them.",
                  },
                  {
                    t: "Rigor without drama",
                    d: "High standards, low theatrics. Calm coaching, sharp notes.",
                  },
                ].map((v) => (
                  <li key={v.t} className="rounded-2xl border border-zinc-200/80 bg-stone-50 p-5">
                    <p className="font-semibold text-zinc-950">{v.t}</p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600">{v.d}</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>

        <section className="mt-14 rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Want to see if it’s a fit?
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Start with a free consult. If we can help, we’ll say how. If not, we’ll say that
            too.
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


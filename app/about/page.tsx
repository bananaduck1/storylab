import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "About StoryLab: warm, incisive admissions coaching that keeps essays radically personal, readable, and calm.",
};

export default function AboutPage() {
  return (
    <div className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl bg-paper/92 px-6 py-16 sm:py-20">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
            About
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
            Craft, plus calm judgment.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-700">
            Hi, I’m Sam. In 2020, I was admitted to Yale, Harvard, Stanford, and Princeton. I chose
            Yale, studied creative writing, graduated magna cum laude and Phi Beta Kappa with
            Distinction, won university writing prizes, and later interviewed applicants for Yale.
            I now work closely with a small number of students so their essays stay unmistakably
            human.
          </p>
        </header>

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


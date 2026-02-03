import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Academy",
  description:
    "Admissions officers come from the humanities. We train students to write for them.",
};

const testimonials = [
  {
    quote: "StoryLab helped my daughter find her authentic voice. The essay she submitted was genuinely hers.",
    school: "Harvard '29",
  },
  {
    quote: "Working with StoryLab was transformative. They don't write for you—they teach you to write better.",
    school: "Yale '28",
  },
  {
    quote: "The coaching went beyond college apps. My son learned skills he'll use for the rest of his life.",
    school: "Princeton '29",
  },
];

export default function AcademyPage() {
  return (
    <div className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl bg-paper/92 px-6 py-16 sm:py-20">
        {/* HERO */}
        <header className="max-w-4xl">
          <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight text-zinc-950 sm:text-5xl">
            Admissions officers come from the humanities. We train students to write for them.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-600">
            Our students have been admitted to Harvard, Yale, Princeton, Stanford, and other top universities.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/results"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
            >
              See results
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Schedule a consultation
            </Link>
          </div>
        </header>

        {/* THE PROBLEM */}
        <section className="mt-20 border-t border-zinc-200/70 pt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            By 12th grade, it's too late.
          </h2>
          <div className="mt-6 max-w-3xl space-y-4 text-base leading-relaxed text-zinc-600">
            <p>
              Most students start essays senior year. By then, they've built a generic application—same
              activities, same positioning as thousands of others. Essays alone can't fix that.
            </p>
            <p>
              Writing is harder than people think. Developing a genuine voice takes years, not months.
              The students who stand out started earlier.
            </p>
          </div>
        </section>

        {/* THREE PATHS */}
        <section className="mt-20 border-t border-zinc-200/70 pt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Three paths. One foundation.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Link
              href="/academy/humanities"
              className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
            >
              <h3 className="text-lg font-semibold tracking-tight text-zinc-950 group-hover:text-zinc-700">
                Humanities Foundations
              </h3>
              <p className="mt-2 text-base leading-relaxed text-zinc-600">
                Grades 7–11. Build the skills before you need them.
              </p>
            </Link>
            <Link
              href="/academy/applications"
              className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
            >
              <h3 className="text-lg font-semibold tracking-tight text-zinc-950 group-hover:text-zinc-700">
                College Applications
              </h3>
              <p className="mt-2 text-base leading-relaxed text-zinc-600">
                Grades 11–12. Position and apply with a voice that's already developed.
              </p>
            </Link>
            <Link
              href="/academy/transfer"
              className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
            >
              <h3 className="text-lg font-semibold tracking-tight text-zinc-950 group-hover:text-zinc-700">
                Transfer
              </h3>
              <p className="mt-2 text-base leading-relaxed text-zinc-600">
                College students. A second chance to get the story right.
              </p>
            </Link>
          </div>
        </section>

        {/* OUR TUTORS */}
        <section className="mt-20 border-t border-zinc-200/70 pt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Not just Ivy graduates. Ivy admissions insiders.
          </h2>
          <ul className="mt-6 space-y-3 text-base leading-relaxed text-zinc-600">
            <li className="flex gap-3">
              <span className="text-zinc-400">•</span>
              <span>Studied creative writing at Harvard and Yale</span>
            </li>
            <li className="flex gap-3">
              <span className="text-zinc-400">•</span>
              <span>National writing awards and published work</span>
            </li>
            <li className="flex gap-3">
              <span className="text-zinc-400">•</span>
              <span>Worked inside Ivy admissions offices</span>
            </li>
            <li className="flex gap-3">
              <span className="text-zinc-400">•</span>
              <span>Most admitted to multiple of Harvard, Yale, Princeton, Stanford</span>
            </li>
          </ul>
          <div className="mt-8">
            <Link
              href="/team"
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Meet the team
            </Link>
          </div>
        </section>

        {/* WHY THIS MATTERS */}
        <section className="mt-20 border-t border-zinc-200/70 pt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Why this matters beyond college
          </h2>
          <div className="mt-6 max-w-3xl text-base leading-relaxed text-zinc-600">
            <p>
              Admissions is the first test. The job market is the next. In an era where AI can perform
              most technical skills, the people who succeed are the ones who can think clearly, write
              persuasively, and make meaning. We train that.
            </p>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="mt-20 border-t border-zinc-200/70 pt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            What families say
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-6">
                <p className="text-lg font-semibold text-zinc-900">{t.school}</p>
                <p className="mt-3 text-base leading-relaxed text-zinc-600">
                  "{t.quote}"
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mt-20 rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            We take limited students each cycle.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600">
            Writing develops slowly. The earlier you start, the more options you have. Schedule a
            consultation to discuss fit and timing.
          </p>
          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Schedule a consultation
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

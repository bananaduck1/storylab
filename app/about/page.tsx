import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Approach",
  description:
    "Our approach to humanities training and college applications: philosophy, method, and how StoryLab builds reading, writing, and thinking skills.",
};

export default function AboutPage() {
  return (
    <div className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl bg-paper/92 px-6 py-16 sm:py-20">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
            Our Approach
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
            Philosophy and method
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-700">
            StoryLab builds the reading, writing, and thinking skills elite universities still
            select for. We teach humanities foundations early, then help students apply those skills
            to college applications.
          </p>
        </header>

        <section className="mt-12 grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-7">
            <div className="rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                Our philosophy
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-zinc-600">
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
            </div>
          </div>
          <aside className="md:col-span-5">
            <div className="rounded-3xl border border-zinc-200 bg-white p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
                Our method
              </p>
              <ul className="mt-5 space-y-4 text-sm text-zinc-700">
                {[
                  {
                    t: "Humanities foundations",
                    d: "Reading, analytical writing, thinking, and intellectual voice—taught consistently across all tutors.",
                  },
                  {
                    t: "College applications",
                    d: "Personal statements, supplements, and positioning—applying the foundation students have built.",
                  },
                  {
                    t: "Consistent pedagogy",
                    d: "All StoryLab tutors use the same method, ensuring quality and continuity across the program.",
                  },
                ].map((v) => (
                  <li key={v.t} className="rounded-2xl border border-zinc-200/80 bg-paper p-5">
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
            Want to learn more?
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
            Explore our programs or reach out to discuss which path fits your student's timeline
            and goals.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="/services"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              Explore Programs
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              Contact
            </a>
          </div>
        </section>

        <section className="mt-14 border-t border-zinc-200/70 pt-12">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-950">Founding</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
            StoryLab was founded by a humanities graduate admitted to Yale, Harvard, Stanford, and
            Princeton. The method has since been refined and taught by a team of trained humanities
            graduates, all using the same StoryLab pedagogy to help students build the skills elite
            universities still select for.
          </p>
        </section>
      </div>
    </div>
  );
}

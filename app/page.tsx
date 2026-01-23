import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Elite humanities training and college applications support—reading, writing, and thinking skills taught by trained humanities graduates.",
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
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:gap-12 lg:items-start">
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-zinc-950 sm:text-5xl">
                Elite humanities training for the AI age
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-700">
                StoryLab builds the reading, writing, and thinking skills that make you
                future-proof, college and beyond. Taught by trained Ivy League humanities graduates.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="/services"
                  className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm shadow-zinc-900/15 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
                >
                  Explore Programs
                </a>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <Image
                src="/photo-1.png"
                alt=""
                width={400}
                height={400}
                className="h-auto w-full max-w-sm rounded-lg object-cover shadow-md border border-line/30 lg:max-w-md"
                priority
              />
            </div>
          </div>
        </section>

        {/* What We Do - Two paths */}
        <section className="border-t border-zinc-200/70 py-14 sm:py-16">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                Two paths. One foundation.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
                Humanities foundations build the skills. College applications put them to use.
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold tracking-tight text-zinc-950">
                Humanities Foundations (7th-11th grade)
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                Middle school through high school. Reading, analytical writing, thinking, and
                intellectual voice. The skills that compound over years and make strong college
                essays possible.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold tracking-tight text-zinc-950">
                College Applications (12th grade)
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                11th and 12th grade. Personal statements, supplements, positioning. We help students
                apply the foundation they've built to tell their story clearly and authentically.
              </p>
            </div>
          </div>
        </section>

        {/* Philosophy - Why start early */}
        <section className="border-t border-zinc-200/70 py-14 sm:py-16">
          <div className="grid gap-10 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-5">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                Why start early
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                Reading, writing, and thinking are skills that compound. The best college essays
                aren't written in a month—they're built over years of practice.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                Students who start early develop intellectual voice naturally. By 12th grade, they
                have something real to say, not just achievements to list.
              </p>
            </div>
            <div className="md:col-span-7">
              <dl className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    k: "Compounding skills",
                    v: "Reading and writing improve through consistent practice, not last-minute cramming.",
                  },
                  {
                    k: "Intellectual voice",
                    v: "Students learn to think and write with clarity and originality over time.",
                  },
                  {
                    k: "Authentic essays",
                    v: "Strong applications come from students who've developed their voice, not manufactured it.",
                  },
                ].map((item) => (
                  <div
                    key={item.k}
                    className="rounded-2xl border border-zinc-200 bg-white p-5"
                  >
                    <dt className="text-sm font-semibold text-zinc-950">{item.k}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-zinc-600">{item.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Tutors */}
        <section className="border-t border-zinc-200/70 py-14 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:gap-12 lg:items-start">
            <div className="flex justify-center lg:justify-start order-2 lg:order-1">
              <Image
                src="/photo-2.png"
                alt=""
                width={400}
                height={400}
                className="h-auto w-full max-w-sm rounded-lg object-cover shadow-md border border-line/30 lg:max-w-md"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                Our tutors
              </h2>
              <div className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-zinc-600">
                <p>
                  StoryLab tutors are trained humanities graduates admitted to multiple top universities.
                  We vet for strong writing, clear thinking, and the ability to teach.
                </p>
                <p>
                  All tutors use the same StoryLab pedagogy—a consistent method for building reading,
                  writing, and thinking skills. Students work one-on-one with a StoryLab tutor, but the
                  approach is shared across the program.
                </p>
                <p>
                  This isn't a one-person operation. It's a team of trained educators using a proven
                  method to help students develop the skills elite universities still select for.
                </p>
              </div>
              <div className="mt-8">
                <a
                  href="/team"
                  className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm shadow-zinc-900/15 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
                >
                  Meet the team
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-zinc-200/70 py-14 sm:py-16">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                How it works
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
                A simple process designed to build skills over time, not rush results.
              </p>
            </div>
          </div>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Assess and plan",
                d: "We evaluate current skills and create a plan that matches the student's timeline and goals.",
              },
              {
                n: "02",
                t: "Build the foundation",
                d: "For humanities foundations, we focus on reading, analytical writing, and thinking. For college applications, we apply these skills to essays and positioning.",
              },
              {
                n: "03",
                t: "Iterate and refine",
                d: "Regular feedback and revision. Students see their progress over time, not just at the end.",
              },
            ].map((s) => (
              <li key={s.n} className="rounded-2xl border border-zinc-200 bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  {s.n}
                </p>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-zinc-950">
                  {s.t}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Testimonials */}
        <section className="border-t border-zinc-200/70 py-14 sm:py-16">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                What families say
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
                Notes from students and parents.
              </p>
            </div>
            <div className="flex-shrink-0">
              <a
                href="/results"
                className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm shadow-zinc-900/15 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
              >
                Read more
              </a>
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                q: "“What stood out most was the genuine sense of care. Our meetings were effective and motivating, and having a real game plan made the entire process far less stressful—for both me and my mom.”",
                a: "Student admitted to Vanderbilt '29",
              },
              {
                q: "“My tutor told me honestly when a draft felt cheesy and pushed me to rewrite it into something more sincere. They taught me to write logically and authentically, without over-flexing, and helped me discover what actually made my story unique.”",
                a: "Student admitted to Northwestern '28",
              },
              {
                q: "“My other counselor has plenty of clients and experience, but it was only when I started working with StoryLab that my essays finally felt like mine.”",
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
              Ready to build the foundation?
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
              Explore our programs or reach out to discuss which path fits your student's timeline
              and goals.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/services"
                className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm shadow-zinc-900/15 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
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
          </div>
        </section>
      </div>
    </div>
  );
}

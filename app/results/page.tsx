import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Results",
  description:
    "Testimonials for StoryLab — honest notes from students and families. No invented stats or guarantees.",
};

const testimonials = [
  {
    quote:
      "Working with Sam was one of the most important factors in my college application process. His feedback was specific, personalized, and genuinely insightful — far beyond what I received from my school counselor. He didn't just comment on my ideas broadly; he engaged with individual sentences, pushing me to sharpen my thinking and present myself as clearly and authentically as possible. His dedication made a real difference. I felt supported throughout the entire process, and my essays became something I was truly proud of.",
    attribution: "Student attending University of Chicago",
    type: "student",
  },
  {
    quote:
      "What stood out immediately was how broadly experienced he is. Whatever I brought to the table — my academic interests, my extracurriculars — he had enough background to understand where I was coming from and give feedback that actually resonated. His feedback was always sharp and constructive. When my early drafts weren't working, he didn't just tell me what was wrong — he pushed me toward something more sincere and more genuinely me. The most important lesson I took: write logically and authentically. Don't jump around, and don't over-flex. Your activities list already speaks for itself — your essays should reveal who you actually are.",
    attribution: "Student attending Northwestern",
    type: "student",
  },
  {
    quote:
      "The college application process is stressful and time-consuming — but working with Sam made it genuinely manageable. What set our sessions apart was how collaborative and intentional they were. We spent real time talking through ideas, building a clear game plan for my essays and deadlines. I always left feeling like I knew exactly what I was working toward. But what I want to emphasize most is Sam's genuine sense of care. He communicated consistently, gave thoughtful feedback, and made the whole process feel less like a grind and more like something I could actually be proud of.",
    attribution: "Student attending Vanderbilt",
    type: "student",
  },
  {
    quote:
      "As my daughter's college application season approached, I sought out the best essay tutor who could truly understand and support her — someone who could see her. Meeting Sam turned out to be one of the greatest blessings for both of us. After just the first session, my daughter had already placed complete trust in him and felt genuinely confident that she could do this. He also checked in on me regularly with warm, encouraging messages — he wasn't just a support system for my daughter, but for me as a worried parent as well. Sam is a teacher who truly listens to what a student is wrestling with and draws out exactly what they need.",
    attribution: "Parent of a student admitted to Washington University in St. Louis",
    type: "parent",
  },
];

export default function ResultsPage() {
  return (
    <div className="bg-transparent">
      <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-20">

        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Results
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
            Clear work. Honest boundaries.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-600">
            No invented stats or guarantees. Just notes from students and parents, in their own words.
          </p>
        </header>

        <div className="mt-14 space-y-6">
          {testimonials.map((t, i) => (
            <figure
              key={i}
              className={`rounded-2xl border p-8 sm:p-10 ${
                t.type === "parent"
                  ? "border-zinc-300 bg-zinc-50"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <blockquote className="text-base leading-relaxed text-zinc-700 sm:text-[1.0625rem]">
                <span className="mr-0.5 text-2xl leading-none text-zinc-300">&ldquo;</span>
                {t.quote}
                <span className="ml-0.5 text-2xl leading-none text-zinc-300">&rdquo;</span>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-zinc-200" />
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                    t.type === "parent" ? "text-zinc-500" : "text-zinc-400"
                  }`}
                >
                  {t.attribution}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>

        <section className="mt-14 rounded-3xl border border-zinc-200 bg-white p-8 text-center sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Want to talk through your situation?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-600">
            We&rsquo;ll clarify what support would help — and what would be unnecessary.
          </p>
          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Get started
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}

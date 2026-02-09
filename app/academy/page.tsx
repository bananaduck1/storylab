"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TutorStickySection, type Tutor } from "@/components/TutorCard";
import { LogoMarquee } from "@/components/LogoMarquee";

const testimonials = [
  {
    quote: "What stood out most was the genuine sense of care. Our meetings were effective and motivating, and having a real game plan made the entire process far less stressful—for both me and my mom.",
    school: "Vanderbilt '29",
  },
  {
    quote: "My tutor told me honestly when a draft felt cheesy and pushed me to rewrite it into something more sincere. They taught me to write logically and authentically, without over-flexing.",
    school: "Northwestern '28",
  },
  {
    quote: "I worked with another company that has plenty of clients and experience, but it was only when I started working with StoryLab that my essays finally felt like mine.",
    school: "UChicago '30",
  },
];

const tutors: Tutor[] = [
  {
    id: "sam",
    name: "Sam Ahn",
    title: "Founder & Lead Coach",
    headshotSrc: "/tutor%20photos/sam/sam_headshot.jpg",
    actionSrc: "/tutor%20photos/sam/sam_action.jpg.jpg",
    shortBio: "Yale '25. Acceptances: Yale, Harvard, Princeton, Stanford. Interviewer at Yale Admissions Office. Wallace Prize recipient.",
    longBio: "Yale '25. Acceptances: Yale, Harvard, Princeton, Stanford. Interviewer at Yale Admissions Office. Wallace Prize recipient.",
  },
  {
    id: "olivia",
    name: "Olivia O'Connor",
    title: "Senior Writing Coach",
    headshotSrc: "/tutor%20photos/olivia/olivia_headshot.JPG",
    actionSrc: "/tutor%20photos/olivia/olivia_headshot.JPG",
    shortBio: "Yale '24. Acceptances: Yale, Harvard, Columbia, Brown. Recruitment Coordinator at Yale Admissions Office. John Hubbard Curtis Prize recipient.",
    longBio: "Yale '24. Acceptances: Yale, Harvard, Columbia, Brown. Recruitment Coordinator at Yale Admissions Office. John Hubbard Curtis Prize recipient.",
  },
  {
    id: "maren",
    name: "Maren Wong",
    title: "Applications Strategist",
    headshotSrc: "/tutor%20photos/maren/maren_headshot.jpeg",
    actionSrc: "/tutor%20photos/maren/maren_headshot.jpeg",
    shortBio: "Harvard '26, Cambridge '27. Acceptances: Harvard, Yale. President of the Harvard Advocate. Bowdoin Prize recipient and John Harvard Scholar.",
    longBio: "Harvard '26, Cambridge '27. Acceptances: Harvard, Yale. President of the Harvard Advocate. Bowdoin Prize recipient and John Harvard Scholar.",
  },
];

const sections = [
  { id: "hero", label: "Welcome" },
  { id: "problem", label: "The Problem" },
  { id: "paths", label: "Programs" },
  { id: "tutors", label: "Our Team" },
  { id: "why", label: "Why It Matters" },
  { id: "acceptances", label: "Acceptances" },
  { id: "testimonials", label: "Results" },
  { id: "cta", label: "Get Started" },
];

function ProgressDots({ activeIndex, onDotClick }: { activeIndex: number; onDotClick: (idx: number) => void }) {
  return (
    <nav className="fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-3 md:flex" aria-label="Section navigation">
      {sections.map((s, i) => (
        <button
          key={s.id}
          onClick={() => onDotClick(i)}
          className={`group relative h-3 w-3 rounded-full transition-all duration-300 ${
            i === activeIndex ? "bg-zinc-900 scale-110" : "bg-zinc-300 hover:bg-zinc-400"
          }`}
          aria-label={`Go to ${s.label}`}
          aria-current={i === activeIndex ? "true" : undefined}
        >
          <span className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            {s.label}
          </span>
        </button>
      ))}
    </nav>
  );
}

export default function AcademyPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track active section via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            const idx = sectionRefs.current.findIndex((ref) => ref === entry.target);
            if (idx !== -1) setActiveIndex(idx);
          }
        });
      },
      { threshold: 0.5, rootMargin: "-10% 0px -10% 0px" }
    );

    sectionRefs.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (idx: number) => {
    const section = sectionRefs.current[idx];
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <ProgressDots activeIndex={activeIndex} onDotClick={scrollToSection} />

      <div
        ref={containerRef}
        className="scroll-snap-container"
      >
        {/* HERO */}
        <section
          ref={(el) => { sectionRefs.current[0] = el; }}
          id="hero"
          className="scroll-snap-section section-reveal flex min-h-[100svh] items-center"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div className="max-w-xl">
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
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src="/photo-1.png"
                  alt="Students working together"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* THE PROBLEM */}
        <section
          ref={(el) => { sectionRefs.current[1] = el; }}
          id="problem"
          className="scroll-snap-section section-reveal flex min-h-[100svh] items-center bg-white/50"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl md:order-1">
                <Image
                  src="/photo-4.png"
                  alt="Early preparation matters"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="max-w-xl md:order-2">
                <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                  By 12th grade, it's too late.
                </h2>
                <div className="mt-6 space-y-4 text-base leading-relaxed text-zinc-600">
                  <p>
                    Most students start essays senior year. By then, they've built a generic application—same
                    activities, same positioning as thousands of others. Essays alone can't fix that.
                  </p>
                  <p>
                    Writing is harder than people think. Developing a genuine voice takes years, not months.
                    The students who stand out started earlier.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THREE PATHS */}
        <section
          ref={(el) => { sectionRefs.current[2] = el; }}
          id="paths"
          className="scroll-snap-section section-reveal flex min-h-[100svh] items-center"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Three paths. One foundation.
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <Link
                href="/academy/humanities"
                className="group rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:border-zinc-300 hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold tracking-tight text-zinc-950 group-hover:text-zinc-700">
                  Humanities Foundations
                </h3>
                <p className="mt-3 text-base leading-relaxed text-zinc-600">
                  Grades 7–11. Build the skills before you need them.
                </p>
                <p className="mt-4 text-sm font-medium text-zinc-500 group-hover:text-zinc-700">
                  Learn more →
                </p>
              </Link>
              <Link
                href="/academy/applications"
                className="group rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:border-zinc-300 hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold tracking-tight text-zinc-950 group-hover:text-zinc-700">
                  College Applications
                </h3>
                <p className="mt-3 text-base leading-relaxed text-zinc-600">
                  Grades 11–12. Position and apply with a voice that's already developed.
                </p>
                <p className="mt-4 text-sm font-medium text-zinc-500 group-hover:text-zinc-700">
                  Learn more →
                </p>
              </Link>
              <Link
                href="/academy/transfer"
                className="group rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:border-zinc-300 hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold tracking-tight text-zinc-950 group-hover:text-zinc-700">
                  Transfer Applications
                </h3>
                <p className="mt-3 text-base leading-relaxed text-zinc-600">
                  College students. A second chance to get the story right.
                </p>
                <p className="mt-4 text-sm font-medium text-zinc-500 group-hover:text-zinc-700">
                  Learn more →
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* OUR TUTORS - Two-column sticky layout with scrollable cards */}
        <section
          ref={(el) => { sectionRefs.current[3] = el; }}
          id="tutors"
          className="scroll-snap-section section-reveal min-h-[100svh] bg-white/50 py-16"
        >
          <TutorStickySection
            tutors={tutors}
            headline="Not just Ivy graduates, but Ivy admissions insiders."
            body="Nationally awarded, published writers trained at Harvard and Yale, with multiple offers from top schools and experience in Ivy admissions offices."
            ctaHref="/team"
            ctaLabel="Meet the full team"
          />
        </section>

        {/* WHY THIS MATTERS - Now with photo-2 */}
        <section
          ref={(el) => { sectionRefs.current[4] = el; }}
          id="why"
          className="scroll-snap-section section-reveal flex min-h-[100svh] items-center"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div className="max-w-xl">
                <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                  Why this matters beyond college
                </h2>
                <p className="mt-8 text-lg leading-relaxed text-zinc-600">
                  Admissions is the first test. The job market is the next. In an era where AI can perform
                  most technical skills, the people who succeed are the ones who can think clearly, write
                  persuasively, and make meaning. We train that.
                </p>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src="/photo-2.png"
                  alt="Skills that matter beyond college"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
                <Image
                  src="/why%20humanities/anthropic.png"
                  alt="Anthropic article screenshot"
                  width={600}
                  height={400}
                  className="h-auto w-full object-contain"
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
                <Image
                  src="/why%20humanities/jp%20morgan.png"
                  alt="JP Morgan article screenshot"
                  width={600}
                  height={400}
                  className="h-auto w-full object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ACCEPTANCES */}
        <section
          ref={(el) => { sectionRefs.current[5] = el; }}
          id="acceptances"
          className="scroll-snap-section section-reveal flex min-h-[100svh] items-center bg-white/50"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-center text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Our students' acceptances
            </h2>
            <div className="mt-12">
              <LogoMarquee />
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section
          ref={(el) => { sectionRefs.current[6] = el; }}
          id="testimonials"
          className="scroll-snap-section section-reveal flex min-h-[100svh] items-center bg-white/50"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              What families say
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-8">
                  <p className="text-xl font-semibold text-zinc-900">{t.school}</p>
                  <p className="mt-4 text-base leading-relaxed text-zinc-600">
                    "{t.quote}"
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/results"
                className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                See all results
              </Link>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section
          ref={(el) => { sectionRefs.current[7] = el; }}
          id="cta"
          className="scroll-snap-section section-reveal flex min-h-[100svh] items-center"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <div className="mx-auto max-w-3xl rounded-3xl border border-zinc-200 bg-white p-10 text-center sm:p-14">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                We take limited students each cycle.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-zinc-600">
                Writing develops slowly. The earlier you start, the more options you have. Schedule a
                consultation to discuss fit and timing.
              </p>
              <div className="mt-10">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-8 py-4 text-base font-medium text-white hover:bg-zinc-800"
                >
                  Schedule a consultation
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

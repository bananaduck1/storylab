"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TutorStickySection, type Tutor } from "@/components/TutorCard";
import { LogoMarquee } from "@/components/LogoMarquee";

// ─── Data ────────────────────────────────────────────────────────────────────

const caseStudySummaries = [
  {
    slug: "jason-lim",
    initial: "J",
    name: "Jason Lim",
    grade: "Senior",
    applying: "Yale, Columbia, UChicago",
    outcome: "Accepted — UChicago",
    color: "bg-[#2C4A3E]",
    teaser:
      "His first essay hit every note: leadership, service, resilience. By the second paragraph, you could predict every sentence coming. That was the problem.",
  },
  {
    slug: "sarah-oh",
    initial: "S",
    name: "Sarah Oh",
    grade: "Senior",
    applying: "Stanford, Yale, Northwestern, Columbia",
    outcome: "Accepted — Northwestern ED",
    color: "bg-[#2A3F5A]",
    teaser:
      "Her essay was beautifully written — clean, controlled, and emotionally distant. After 600 words, you didn't know her any better than at the top of the page.",
  },
  {
    slug: "mia-kang",
    initial: "M",
    name: "Mia Kang",
    grade: "Senior",
    applying: "Emory, Georgetown, UVA, Boston University",
    outcome: "Accepted — Emory ED",
    color: "bg-[#3A4A2A]",
    teaser:
      "Her counselor told her not to write about filmmaking. So she wrote about everything else — and none of it was the thing that actually made her, her.",
  },
];

const philosophy = [
  {
    number: "01",
    belief:
      "Admissions officers are humanists at heart and value humanities-oriented thinking in the application.",
    difference:
      "We train students, even those with STEM backgrounds, to infuse humanistic thinking and reflection in their applications.",
  },
  {
    number: "02",
    belief:
      "Achievements get you in the running. Writing that dares to be emotional and vulnerable gets you admitted.",
    difference:
      "We push students beyond surface-level \"I-learned-x\" sentences to write radically vulnerable narratives admissions officers can't forget.",
  },
  {
    number: "03",
    belief:
      "Writing is an opaque and difficult process that takes months, if not years, to see results. AI tools only make you less distinguishable.",
    difference:
      "We teach students the process of writing itself, which sets them up for success long after the admissions process is over.",
  },
  {
    number: "04",
    belief:
      "By 12th grade, many parts of the application are too late to change. Starting as early as possible to craft a unique narrative is a must.",
    difference:
      "Long before 12th grade, we push students away from cliché narratives and coach them to build strong relationships with teachers.",
  },
];

const testimonials = [
  {
    quote:
      "He didn't just comment on my ideas broadly; he engaged with individual sentences, pushing me to sharpen my thinking and present myself as clearly and authentically as possible.",
    attribution: "Student attending University of Chicago",
    type: "student",
  },
  {
    quote:
      "Your activities list already speaks for itself — your essays should reveal who you actually are. Sam helped me figure out what made my story genuinely mine.",
    attribution: "Student attending Northwestern",
    type: "student",
  },
  {
    quote:
      "What I want to emphasize most is Sam's genuine sense of care. He communicated consistently, gave thoughtful feedback, and made the whole process feel less like a grind and more like something I could actually be proud of. My mom noticed it too — his warm, encouraging messages meant a lot to her throughout the process. If anything, the application season was harder on her than it was on me, and Sam made sure she felt supported as well.",
    attribution: "Student attending Vanderbilt",
    type: "student",
  },
  {
    quote:
      "Sam is a teacher who truly listens to what a student is wrestling with and draws out exactly what they need. I'm certain that any family who works with him will find their child going through the college process with a healthy, grounded, and even happy mindset.",
    attribution: "Parent of a student admitted to Washington University in St. Louis",
    type: "parent",
  },
];

const tutors: Tutor[] = [
  {
    id: "sam",
    name: "Sam Ahn",
    title: "Founder & Lead Coach",
    headshotSrc: "/tutor%20photos/sam/sam_headshot.jpg",
    actionSrc: "/tutor%20photos/sam/sam_action.jpg.jpg",
    shortBio:
      "Yale '25. Acceptances: Yale, Harvard, Princeton, Stanford. Interviewer at Yale Admissions Office. Wallace Prize recipient.",
    longBio:
      "Yale '25. Acceptances: Yale, Harvard, Princeton, Stanford. Interviewer at Yale Admissions Office. Wallace Prize recipient.",
  },
  {
    id: "olivia",
    name: "Olivia O'Connor",
    title: "Senior Writing Coach",
    headshotSrc: "/tutor%20photos/olivia/olivia_headshot.JPG",
    actionSrc: "/tutor%20photos/olivia/olivia_headshot.JPG",
    shortBio:
      "Yale '24. Acceptances: Yale, Harvard, Columbia, Brown. Recruitment Coordinator at Yale Admissions Office. John Hubbard Curtis Prize recipient.",
    longBio:
      "Yale '24. Acceptances: Yale, Harvard, Columbia, Brown. Recruitment Coordinator at Yale Admissions Office. John Hubbard Curtis Prize recipient.",
  },
  {
    id: "maren",
    name: "Maren Wong",
    title: "Applications Strategist",
    headshotSrc: "/tutor%20photos/maren/maren_headshot.jpeg",
    actionSrc: "/tutor%20photos/maren/maren_headshot.jpeg",
    shortBio:
      "Harvard '26, Cambridge '27. Acceptances: Harvard, Yale. President of the Harvard Advocate. Bowdoin Prize recipient and John Harvard Scholar.",
    longBio:
      "Harvard '26, Cambridge '27. Acceptances: Harvard, Yale. President of the Harvard Advocate. Bowdoin Prize recipient and John Harvard Scholar.",
  },
];

const sections = [
  { id: "hero", label: "Welcome" },
  { id: "founder", label: "Our Story" },
  { id: "philosophy", label: "Philosophy" },
  { id: "cases", label: "Student Stories" },
  { id: "paths", label: "Programs" },
  { id: "tutors", label: "Our Team" },
  { id: "why", label: "Why It Matters" },
  { id: "testimonials", label: "Results" },
  { id: "acceptances", label: "Acceptances" },
  { id: "cta", label: "Get Started" },
];

// ─── Philosophy Toggle ────────────────────────────────────────────────────────

function PhilosophyToggle() {
  const [tab, setTab] = useState<"philosophy" | "difference">("philosophy");

  return (
    <div>
      {/* Toggle */}
      <div className="flex w-fit rounded-full border border-zinc-200 bg-zinc-100 p-1">
        <button
          onClick={() => setTab("philosophy")}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
            tab === "philosophy"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Our Philosophy
        </button>
        <button
          onClick={() => setTab("difference")}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
            tab === "difference"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          The StoryLab Difference
        </button>
      </div>

      {/* Items */}
      <div className="mt-6 space-y-3">
        {philosophy.map((item) => (
          <div
            key={item.number}
            className={`overflow-hidden rounded-2xl border p-6 transition-colors ${
              tab === "difference"
                ? "border-emerald-200 bg-emerald-50/60"
                : "border-zinc-200 bg-white"
            }`}
          >
            <div className="flex gap-5">
              <span
                className={`mt-0.5 flex-shrink-0 text-xs font-bold ${
                  tab === "difference" ? "text-emerald-400" : "text-zinc-300"
                }`}
              >
                {item.number}
              </span>
              <p
                className={`text-sm leading-relaxed ${
                  tab === "difference" ? "text-emerald-900" : "text-zinc-600"
                }`}
              >
                {tab === "philosophy" ? item.belief : item.difference}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Nav dots ─────────────────────────────────────────────────────────────────

function ProgressDots({
  activeIndex,
  onDotClick,
}: {
  activeIndex: number;
  onDotClick: (idx: number) => void;
}) {
  return (
    <nav
      className="fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-3 md:flex"
      aria-label="Section navigation"
    >
      {sections.map((s, i) => (
        <button
          key={s.id}
          onClick={() => onDotClick(i)}
          className={`group relative h-3 w-3 rounded-full transition-all duration-300 ${
            i === activeIndex
              ? "scale-110 bg-zinc-900"
              : "bg-zinc-300 hover:bg-zinc-400"
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AcademyPage() {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            const idx = sectionRefs.current.findIndex(
              (ref) => ref === entry.target
            );
            if (idx !== -1) setActiveIndex(idx);
          }
        });
      },
      { threshold: 0.35, rootMargin: "-10% 0px -10% 0px" }
    );
    sectionRefs.current.forEach((s) => {
      if (s) observer.observe(s);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (idx: number) => {
    sectionRefs.current[idx]?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <ProgressDots activeIndex={activeIndex} onDotClick={scrollToSection} />

      <div>

        {/* ── 0. HERO ─────────────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[0] = el; }}
          id="hero"
          className="scroll-snap-section section-reveal flex min-h-[100svh] items-center"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div className="max-w-xl">
                <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight text-zinc-950 sm:text-5xl">
                  Admissions officers are humanists at heart. We train students to write for them.
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

        {/* ── 1. FOUNDER'S STORY ──────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[1] = el; }}
          id="founder"
          className="scroll-snap-section section-reveal flex min-h-[100svh] items-center bg-white/50"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <div className="grid items-center gap-16 md:grid-cols-2">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl md:order-1">
                <Image
                  src="/photo-1.png"
                  alt="Sam Ahn"
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div className="md:order-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  Founder&rsquo;s Story
                </p>
                <h2 className="mt-5 text-3xl font-semibold leading-[1.2] tracking-tight text-zinc-950 sm:text-4xl">
                  Hi, I&rsquo;m Sam.
                </h2>
                <div className="mt-6 space-y-4 text-base leading-relaxed text-zinc-600">
                  <p>
                    By application season, I hadn&rsquo;t won any national awards, nor had I founded an organization that made a huge social impact. I wasn&rsquo;t mobilizing movements; I was nowhere to be found in online media or press.
                  </p>
                  <p>
                    By the standards of high-achieving students aiming for top schools, I was not an &ldquo;impressive&rdquo; student. All I had done was get good grades and participate in school activities.
                  </p>
                  <p>
                    And yet, come March my senior year, I got into Harvard, Yale, Stanford, and Princeton — the only schools I had applied to.
                  </p>
                  <p className="font-medium text-zinc-800">
                    I started StoryLab to teach students the philosophy that got me in.
                  </p>
                </div>
                <div className="mt-8 border-t border-zinc-100 pt-8">
                  <p className="text-sm leading-relaxed text-zinc-500">
                    At Yale, I graduated <em>magna cum laude</em> and Phi Beta Kappa with a B.A. in Comparative Literature. In college, I wrote for some of the world&rsquo;s biggest companies alongside former White House speechwriters, and evaluated high school seniors for the Yale admissions office.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. PHILOSOPHY ───────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[2] = el; }}
          id="philosophy"
          className="scroll-snap-section section-reveal min-h-[100svh] py-24"
        >
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                Our Approach
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                What we believe, and how we act on it.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-500">
                Toggle between our core beliefs and what they mean in practice.
              </p>
            </div>
            <div className="mt-10">
              <PhilosophyToggle />
            </div>
          </div>
        </section>

        {/* ── 3. STUDENT STORIES ──────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[3] = el; }}
          id="cases"
          className="scroll-snap-section section-reveal min-h-[100svh] bg-white/50 py-24"
        >
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                Student Stories
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                Meet some of our students.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-500">
                Every student who arrives at StoryLab has something real to say. They just haven&rsquo;t found it yet.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {caseStudySummaries.map((s) => (
                <Link
                  key={s.slug}
                  href={`/academy/students/${s.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-lg"
                >
                  {/* Card header */}
                  <div className="flex items-center gap-4 border-b border-zinc-100 px-6 py-5">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${s.color} text-base font-semibold text-white`}
                    >
                      {s.initial}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900">{s.name}</p>
                      <p className="text-xs text-zinc-400">{s.grade}</p>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-xs text-zinc-400">{s.applying}</p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-600">
                      {s.teaser}
                    </p>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        {s.outcome}
                      </span>
                      <span className="text-sm font-medium text-zinc-400 transition-colors group-hover:text-zinc-700">
                        Read more →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <p className="mt-8 text-xs text-zinc-400">
              Names and identifying details have been changed.{" "}
              <em>The essays — and the moments that produced them — are real.</em>
            </p>
          </div>
        </section>

        {/* ── 4. THREE PATHS ──────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[4] = el; }}
          id="paths"
          className="scroll-snap-section section-reveal flex min-h-[100svh] items-center"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Three paths. One foundation.
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  href: "/academy/humanities",
                  title: "Humanities Foundations",
                  desc: "Grades 7–11. Build the skills before you need them.",
                },
                {
                  href: "/academy/applications",
                  title: "College Applications",
                  desc: "Grades 11–12. Position and apply with a voice that's already developed.",
                },
                {
                  href: "/academy/transfer",
                  title: "Transfer Applications",
                  desc: "College students. A second chance to get the story right.",
                },
              ].map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="group rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:border-zinc-300 hover:shadow-lg"
                >
                  <h3 className="text-xl font-semibold tracking-tight text-zinc-950 group-hover:text-zinc-700">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-zinc-600">
                    {p.desc}
                  </p>
                  <p className="mt-4 text-sm font-medium text-zinc-400 group-hover:text-zinc-700">
                    Learn more →
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. OUR TUTORS ───────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[5] = el; }}
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

        {/* ── 6. WHY IT MATTERS ───────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[6] = el; }}
          id="why"
          className="scroll-snap-section section-reveal min-h-[100svh] py-24"
        >
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                Why It Matters
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                Preparing for college is preparing for the real world.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-500">
                In an era where AI can perform most technical skills, the people who succeed are the ones who can think clearly, write persuasively, and make meaning. We train that.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2">
              <figure className="rounded-2xl border border-zinc-200 bg-white p-8">
                <blockquote className="text-base leading-relaxed text-zinc-700">
                  <span className="text-2xl leading-none text-zinc-200">&ldquo;</span>
                  I actually think studying the humanities is going to be{" "}
                  <strong className="font-semibold text-zinc-900">
                    more important than ever.
                  </strong>{" "}
                  A lot of these [AI] models are actually very good at STEM. But I think this idea that there are things that make us uniquely human — understanding ourselves, understanding history, understanding what makes us tick — I think that will always be really, really important.
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-zinc-100" />
                  <p className="text-xs font-medium text-zinc-500">
                    Daniela Amodei, President of Anthropic
                  </p>
                </figcaption>
              </figure>

              <figure className="rounded-2xl border border-zinc-200 bg-white p-8">
                <blockquote className="text-base leading-relaxed text-zinc-700">
                  <span className="text-2xl leading-none text-zinc-200">&ldquo;</span>
                  My advice to people would be critical thinking, learn skills, learn your EQ, learn how to be good in a meeting,{" "}
                  <strong className="font-semibold text-zinc-900">
                    how to communicate, how to write. You&rsquo;ll have plenty of jobs.
                  </strong>
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-zinc-100" />
                  <p className="text-xs font-medium text-zinc-500">
                    Jamie Dimon, CEO of JPMorgan Chase
                  </p>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ── 7. TESTIMONIALS ─────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[7] = el; }}
          id="testimonials"
          className="scroll-snap-section section-reveal min-h-[100svh] bg-white/50 py-24"
        >
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                What Families Say
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                In their own words.
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {testimonials.map((t, i) => (
                <figure
                  key={i}
                  className={`flex flex-col rounded-2xl border p-8 ${
                    t.type === "parent"
                      ? "border-zinc-300 bg-zinc-50 md:col-span-2"
                      : "border-zinc-200 bg-white"
                  }`}
                >
                  <blockquote className="flex-1 text-base leading-relaxed text-zinc-600">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-zinc-200" />
                    <p
                      className={`text-xs font-medium ${
                        t.type === "parent" ? "text-zinc-600" : "text-zinc-400"
                      }`}
                    >
                      {t.attribution}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/results"
                className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Read full testimonials
              </Link>
            </div>
          </div>
        </section>

        {/* ── 8. ACCEPTANCES ──────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[8] = el; }}
          id="acceptances"
          className="scroll-snap-section section-reveal flex min-h-[100svh] items-center"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-center text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Our students&rsquo; acceptances
            </h2>
            <div className="mt-12">
              <LogoMarquee />
            </div>
          </div>
        </section>

        {/* ── 9. CTA ──────────────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[9] = el; }}
          id="cta"
          className="scroll-snap-section section-reveal flex min-h-[100svh] items-center bg-white/50"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <div className="mx-auto max-w-3xl rounded-3xl border border-zinc-200 bg-white p-10 text-center sm:p-14">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                We take limited students each cycle.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-zinc-600">
                Writing develops slowly. The earlier you start, the more options you have. Schedule a consultation to discuss fit and timing.
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

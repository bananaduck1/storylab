"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TutorStickySection, type Tutor } from "@/components/TutorCard";
import { LogoMarquee } from "@/components/LogoMarquee";

// ─── Data ────────────────────────────────────────────────────────────────────

const caseStudySummaries = [
  {
    slug: "jason",
    initial: "J",
    name: "Jason",
    grade: "Senior",
    applying: "Yale, Columbia, Dartmouth",
    outcome: "Accepted — Dartmouth",
    color: "bg-[#2C4A3E]",
    teaser:
      "His first essay hit every note: leadership, service, resilience. By the second paragraph, you could predict every sentence coming. That was the problem.",
  },
  {
    slug: "sarah",
    initial: "S",
    name: "Sarah",
    grade: "Senior",
    applying: "Stanford, Yale, Northwestern, Columbia",
    outcome: "Accepted — Princeton",
    color: "bg-[#2A3F5A]",
    teaser:
      "Her essay was beautifully written — clean, controlled, and emotionally distant. After 600 words, you didn't know her any better than at the top of the page.",
  },
  {
    slug: "mia",
    initial: "M",
    name: "Mia",
    grade: "Senior",
    applying: "Emory, Georgetown, UVA, Boston University",
    outcome: "Accepted — Northwestern",
    color: "bg-[#3A4A2A]",
    teaser:
      "Her counselor told her not to write about filmmaking. So she wrote about everything else — and none of it was the thing that actually made her, her.",
  },
];

const philosophy: {
  number: string;
  belief: React.ReactNode;
  difference: React.ReactNode;
}[] = [
  {
    number: "01",
    belief: (
      <>
        Admissions officers are{" "}
        <strong className="font-semibold text-zinc-900">humanists at heart</strong>{" "}
        and value humanities-oriented thinking in the application.
      </>
    ),
    difference: (
      <>
        We train students, even those with STEM backgrounds, to infuse{" "}
        <strong className="font-semibold text-emerald-800">humanistic thinking and reflection</strong>{" "}
        in their applications.
      </>
    ),
  },
  {
    number: "02",
    belief: (
      <>
        Achievements get you in the running. Writing that dares to be{" "}
        <strong className="font-semibold text-zinc-900">emotional and vulnerable</strong>{" "}
        gets you admitted.
      </>
    ),
    difference: (
      <>
        We push students beyond surface-level &ldquo;I-learned-x&rdquo; sentences to write{" "}
        <strong className="font-semibold text-emerald-800">radically vulnerable narratives</strong>{" "}
        admissions officers can&rsquo;t forget.
      </>
    ),
  },
  {
    number: "03",
    belief: (
      <>
        Writing is an opaque and difficult process that takes{" "}
        <strong className="font-semibold text-zinc-900">months, if not years</strong>, to see results.
        AI tools only make you{" "}
        <strong className="font-semibold text-zinc-900">less distinguishable</strong>.
      </>
    ),
    difference: (
      <>
        We teach students{" "}
        <strong className="font-semibold text-emerald-800">the process of writing itself</strong>,
        which sets them up for success long after the admissions process is over.
      </>
    ),
  },
  {
    number: "04",
    belief: (
      <>
        By 12th grade, many parts of the application are too late to change. Starting{" "}
        <strong className="font-semibold text-zinc-900">as early as possible</strong> to craft a{" "}
        <strong className="font-semibold text-zinc-900">unique narrative</strong> is a must.
      </>
    ),
    difference: (
      <>
        Long before 12th grade, we push students away from{" "}
        <strong className="font-semibold text-emerald-800">cliché narratives</strong> and coach them
        to build{" "}
        <strong className="font-semibold text-emerald-800">strong relationships with teachers</strong>.
      </>
    ),
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
    attribution: "Parent of a Washington University in St Louis student",
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
  { id: "thesis", label: "Our Mission" },
  { id: "philosophy", label: "Philosophy" },
  { id: "why", label: "Why It Matters" },
  { id: "cases", label: "Student Stories" },
  { id: "paths", label: "Programs" },
  { id: "tutors", label: "Our Team" },
  { id: "acceptances", label: "Acceptances" },
  { id: "testimonials", label: "Results" },
  { id: "cta", label: "Get Started" },
];

// ─── Philosophy item ──────────────────────────────────────────────────────────

function PhilosophyItemEl({
  number,
  text,
  isDifference = false,
}: {
  number: string;
  text: React.ReactNode;
  isDifference?: boolean;
}) {
  return (
    <div className="flex items-start gap-5 py-4">
      <span
        aria-hidden="true"
        className="flex-shrink-0 w-8 text-lg font-bold leading-none text-zinc-300 mt-0.5"
      >
        {number}
      </span>
      <p
        className={`text-base leading-relaxed ${
          isDifference ? "text-zinc-700" : "text-zinc-600"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

// ─── Philosophy scroll section ────────────────────────────────────────────────

function PhilosophyScrollSection({
  sectionRefCallback,
}: {
  sectionRefCallback: (el: HTMLElement | null) => void;
}) {
  const wrapperRef = useRef<HTMLElement | null>(null);
  const [step, setStep] = useState(0);

  const setRef = (el: HTMLElement | null) => {
    wrapperRef.current = el;
    sectionRefCallback(el);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const totalRange = rect.height - window.innerHeight;
      if (totalRange <= 0) return;
      const progress = -rect.top / totalRange;
      setStep(progress < 0.5 ? 0 : 1);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={setRef}
      id="philosophy"
      className="scroll-snap-section section-reveal relative md:h-[300vh]"
    >
      {/* ── Mobile: static stacked list ──────────────────────────── */}
      <div className="md:hidden px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Our Approach
          </p>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Our Philosophy
          </p>
          <div className="relative mt-4 mb-4 h-80 overflow-hidden rounded-xl">
            <Image src="/in%20the%20crowd.png" alt="" fill className="object-contain" />
          </div>
          <div className="mt-2 space-y-1">
            {philosophy.map((item) => (
              <PhilosophyItemEl key={item.number} number={item.number} text={item.belief} />
            ))}
          </div>

          <div className="my-10 border-t border-zinc-200" />

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
            The StoryLab Difference
          </p>
          <div className="relative mt-4 mb-4 h-80 overflow-hidden rounded-xl">
            <Image src="/photo-1.png" alt="" fill className="object-contain" />
          </div>
          <div className="mt-2 space-y-1">
            {philosophy.map((item) => (
              <PhilosophyItemEl
                key={item.number}
                number={item.number}
                text={item.difference}
                isDifference
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Desktop: scroll-jacked sticky ────────────────────────── */}
      <div className="hidden md:flex sticky top-0 h-screen items-center">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="grid grid-cols-[2fr_3fr] items-center gap-16">

            {/* Left: label + crossfading title + crossfading photo + dots */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                Our Approach
              </p>

              {/* Step title (crossfades) */}
              <div className="mt-4" style={{ display: "grid" }}>
                <h2
                  style={{ gridArea: "1 / 1" }}
                  className={`text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl transition-opacity duration-[250ms] ${
                    step === 0 ? "opacity-100" : "opacity-0"
                  }`}
                >
                  Our Philosophy
                </h2>
                <h2
                  style={{ gridArea: "1 / 1" }}
                  className={`text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl transition-opacity duration-[250ms] ${
                    step === 1 ? "opacity-100" : "opacity-0"
                  }`}
                >
                  The StoryLab Difference
                </h2>
              </div>

              {/* Step photo (crossfades) */}
              <div className="mt-6" style={{ display: "grid" }}>
                <div
                  style={{ gridArea: "1 / 1" }}
                  className={`relative h-80 overflow-hidden rounded-xl transition-opacity duration-[250ms] ${
                    step === 0 ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Image src="/in%20the%20crowd.png" alt="" fill className="object-contain" />
                </div>
                <div
                  style={{ gridArea: "1 / 1" }}
                  className={`relative h-80 overflow-hidden rounded-xl transition-opacity duration-[250ms] ${
                    step === 1 ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Image src="/photo-1.png" alt="" fill className="object-contain" />
                </div>
              </div>

              {/* Dots */}
              <div className="mt-6 flex gap-2">
                <div
                  className={`h-2 w-2 rounded-full transition-colors duration-[250ms] ${
                    step === 0 ? "bg-zinc-900" : "bg-zinc-200"
                  }`}
                />
                <div
                  className={`h-2 w-2 rounded-full transition-colors duration-[250ms] ${
                    step === 1 ? "bg-zinc-900" : "bg-zinc-200"
                  }`}
                />
              </div>
            </div>

            {/* Right: all 4 items, two steps overlaid */}
            <div style={{ display: "grid" }}>
              {/* Step 0: Philosophy */}
              <div
                style={{ gridArea: "1 / 1" }}
                className={`space-y-1 transition-all duration-[250ms] ease-out ${
                  step === 0
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-2 pointer-events-none"
                }`}
              >
                {philosophy.map((item) => (
                  <PhilosophyItemEl key={item.number} number={item.number} text={item.belief} />
                ))}
              </div>

              {/* Step 1: Difference */}
              <div
                style={{ gridArea: "1 / 1" }}
                className={`space-y-1 transition-all duration-[250ms] ease-out ${
                  step === 1
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2 pointer-events-none"
                }`}
              >
                {philosophy.map((item) => (
                  <PhilosophyItemEl
                    key={item.number}
                    number={item.number}
                    text={item.difference}
                    isDifference
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Quotes scroll section ────────────────────────────────────────────────────

function WhyItMattersScrollSection({
  sectionRefCallback,
}: {
  sectionRefCallback: (el: HTMLElement | null) => void;
}) {
  const wrapperRef = useRef<HTMLElement | null>(null);
  const [step, setStep] = useState(0);

  const setRef = (el: HTMLElement | null) => {
    wrapperRef.current = el;
    sectionRefCallback(el);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const totalRange = rect.height - window.innerHeight;
      if (totalRange <= 0) return;
      const progress = -rect.top / totalRange;
      setStep(progress < 0.5 ? 0 : 1);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={setRef}
      id="why"
      className="scroll-snap-section section-reveal relative bg-white/50 md:h-[250vh]"
    >
      {/* ── Mobile: static stacked quotes ────────────────────────── */}
      <div className="md:hidden px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Why It Matters
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
            Preparing for college is preparing for the real world.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-500">
            In an era where AI can perform most technical skills, the people who succeed are the
            ones who can think clearly, write persuasively, and make meaning. We train that.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-10 px-6">
          {/* Amodei */}
          <div>
            <div className="mb-5 relative h-56 w-full overflow-hidden rounded-xl opacity-80">
              <Image src="/daniela%20amodei.png" alt="Daniela Amodei" fill className="object-cover" />
            </div>
            <blockquote className="text-xl italic leading-relaxed text-zinc-700">
              <strong className="not-italic font-semibold text-zinc-900">
                I actually think studying the humanities is going to be more important than ever.
              </strong>{" "}
              A lot of these [AI] models are actually very good at STEM. But I think this idea
              that there are things that make us uniquely human — understanding ourselves,
              understanding history, understanding what makes us tick — I think that will always
              be really, really important.
            </blockquote>
            <div className="mt-5 flex items-center gap-3">
              <div className="h-px w-8 bg-zinc-300" />
              <p className="text-xs text-zinc-400">Daniela Amodei, President of Anthropic</p>
            </div>
          </div>

          {/* Dimon */}
          <div>
            <div className="mb-5 relative h-56 w-full overflow-hidden rounded-xl">
              <Image src="/jamie%20dimon.png" alt="Jamie Dimon" fill className="object-cover" />
            </div>
            <blockquote className="text-xl italic leading-relaxed text-zinc-700">
              My advice to people would be critical thinking, learn skills, learn your EQ, learn
              how to be good in a meeting,{" "}
              <strong className="not-italic font-semibold text-zinc-900">
                how to communicate, how to write. You&rsquo;ll have plenty of jobs.
              </strong>
            </blockquote>
            <div className="mt-5 flex items-center gap-3">
              <div className="h-px w-8 bg-zinc-300" />
              <p className="text-xs text-zinc-400">Jamie Dimon, CEO of JPMorgan Chase</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop: scroll-jacked sticky ────────────────────────── */}
      <div className="hidden md:flex sticky top-0 h-screen items-center px-6">
        <div className="w-full max-w-6xl mx-auto">

          {/* Section header */}
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
              Why It Matters
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Preparing for college is preparing for the real world.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-500">
              In an era where AI can perform most technical skills, the people who succeed are the
              ones who can think clearly, write persuasively, and make meaning. We train that.
            </p>
          </div>

          {/* Crossfading quotes */}
          <div style={{ display: "grid" }}>

            {/* Step 0: Amodei — photo left, text right */}
            <div
              style={{ gridArea: "1 / 1" }}
              className={`transition-all duration-[250ms] ease-out ${
                step === 0
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
            >
              <div className="grid grid-cols-2 gap-12 items-center">
                <div className="relative overflow-hidden rounded-xl opacity-80 min-h-[360px]">
                  <Image src="/daniela%20amodei.png" alt="Daniela Amodei" fill className="object-cover object-top" />
                </div>
                <div>
                  <blockquote className="text-2xl italic leading-relaxed text-zinc-700">
                    <strong className="not-italic font-semibold text-zinc-900">
                      I actually think studying the humanities is going to be more important than ever.
                    </strong>{" "}
                    A lot of these [AI] models are actually very good at STEM. But I think this idea
                    that there are things that make us uniquely human — understanding ourselves,
                    understanding history, understanding what makes us tick — I think that will always
                    be really, really important.
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-px w-10 bg-zinc-300" />
                    <p className="text-xs text-zinc-400">Daniela Amodei, President of Anthropic</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1: Dimon — text left, photo right */}
            <div
              style={{ gridArea: "1 / 1" }}
              className={`transition-all duration-[250ms] ease-out ${
                step === 1
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2 pointer-events-none"
              }`}
            >
              <div className="grid grid-cols-2 gap-12 items-center">
                <div>
                  <blockquote className="text-2xl italic leading-relaxed text-zinc-700">
                    My advice to people would be critical thinking, learn skills, learn your EQ, learn
                    how to be good in a meeting,{" "}
                    <strong className="not-italic font-semibold text-zinc-900">
                      how to communicate, how to write. You&rsquo;ll have plenty of jobs.
                    </strong>
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-px w-10 bg-zinc-300" />
                    <p className="text-xs text-zinc-400">Jamie Dimon, CEO of JPMorgan Chase</p>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-xl min-h-[360px]">
                  <Image src="/jamie%20dimon.png" alt="Jamie Dimon" fill className="object-cover object-top" />
                </div>
              </div>
            </div>

          </div>

          {/* Progress dots */}
          <div className="mt-8 flex gap-2">
            <div
              className={`h-2 w-2 rounded-full transition-colors duration-[250ms] ${
                step === 0 ? "bg-zinc-900" : "bg-zinc-200"
              }`}
            />
            <div
              className={`h-2 w-2 rounded-full transition-colors duration-[250ms] ${
                step === 1 ? "bg-zinc-900" : "bg-zinc-200"
              }`}
            />
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── Language switcher ────────────────────────────────────────────────────────

function LanguageSwitcher({ currentLang }: { currentLang: "en" | "zh" | "ko" }) {
  const langs = [
    { code: "en", label: "EN", href: "/academy" },
    { code: "zh", label: "中文", href: "/academy/zh" },
    { code: "ko", label: "한국어", href: "/academy/ko" },
  ] as const;

  return (
    <div className="fixed top-4 right-16 z-50 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-zinc-200">
      {langs.map((lang, i) => (
        <React.Fragment key={lang.code}>
          {i > 0 && (
            <span className="text-zinc-200 select-none text-xs">|</span>
          )}
          <Link
            href={lang.href}
            className={`text-xs tracking-wide ${
              currentLang === lang.code
                ? "font-medium text-zinc-900"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            {lang.label}
          </Link>
        </React.Fragment>
      ))}
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
      { threshold: 0.2, rootMargin: "-5% 0px -5% 0px" }
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

        <LanguageSwitcher currentLang="en" />

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
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src="/photo-2.png"
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
                  src="/StoryLab%20Sam%20talking.png"
                  alt="Sam Ahn"
                  fill
                  className="object-cover object-center"
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
                    By application season, I hadn&rsquo;t won any national awards, nor had I founded
                    an organization that made a huge social impact. I wasn&rsquo;t mobilizing
                    movements; I was nowhere to be found in online media or press.
                  </p>
                  <p>
                    By the standards of high-achieving students aiming for top schools, I was not
                    an &ldquo;impressive&rdquo; student. All I had done was get good grades and
                    participate in school activities.
                  </p>
                  <p>
                    And yet, come March my senior year, I got into Harvard, Yale, Stanford, and
                    Princeton — the only schools I had applied to.
                  </p>
                  <p>
                    I started StoryLab to teach students the philosophy that got me in.
                  </p>
                  <p>
                    At Yale, I graduated <em>magna cum laude</em> and Phi Beta Kappa with a B.A. in
                    Comparative Literature. In college, I wrote for some of the world&rsquo;s biggest
                    companies alongside former White House speechwriters, and evaluated high school
                    seniors for the Yale admissions office.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. THESIS ────────────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[2] = el; }}
          id="thesis"
          className="scroll-snap-section section-reveal flex min-h-[100svh] items-stretch"
        >
          <div className="grid w-full md:grid-cols-2">
            {/* Left: bold statement */}
            <div className="flex items-center px-8 py-6 md:px-16">
              <p className="text-4xl font-bold leading-tight tracking-tight text-zinc-950 sm:text-5xl">
                In an application field where it&rsquo;s harder to stand out than ever, we give
                students the tools to tell a killer story.
              </p>
            </div>
            {/* Right: supporting copy */}
            <div className="flex items-center justify-center bg-white/60 px-8 py-6 md:px-16">
              <p className="text-center text-xl leading-relaxed text-zinc-600 sm:text-2xl">
                Many families make the mistake of pouring all their energy into hard parts of the
                application like test scores and awards, when it&rsquo;s the softer parts of an
                application that get students admitted.
              </p>
            </div>
          </div>
        </section>

        {/* ── 3. PHILOSOPHY (scroll-driven) ───────────────────────────── */}
        <PhilosophyScrollSection
          sectionRefCallback={(el) => { sectionRefs.current[3] = el; }}
        />

        {/* ── 4. WHY IT MATTERS (scroll-driven) ───────────────────────── */}
        <WhyItMattersScrollSection
          sectionRefCallback={(el) => { sectionRefs.current[4] = el; }}
        />

        {/* ── 5. STUDENT STORIES ──────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[5] = el; }}
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
                Every student who arrives at StoryLab has something real to say. They just haven&rsquo;t found it&nbsp;yet.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {caseStudySummaries.map((s) => (
                <Link
                  key={s.slug}
                  href={`/academy/students?student=${s.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-lg"
                >
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
                  <div className="flex flex-1 flex-col p-6">
                    <p className="flex-1 text-sm leading-relaxed text-zinc-600">{s.teaser}</p>
                    <div className="mt-8">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700">
                        {s.outcome}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. THREE PATHS ──────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[6] = el; }}
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
                  desc: "Build the skills before you need them.",
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
                  <p className="mt-3 text-base leading-relaxed text-zinc-600">{p.desc}</p>
                  <p className="mt-4 text-sm font-medium text-zinc-400 group-hover:text-zinc-700">
                    Learn more →
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. OUR TUTORS ───────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[7] = el; }}
          id="tutors"
          className="hidden scroll-snap-section section-reveal min-h-[100svh] bg-white/50 py-16"
        >
          <TutorStickySection
            tutors={tutors}
            headline="Not just Ivy graduates, but Ivy admissions insiders."
            body="Nationally awarded, published writers trained at Harvard and Yale, with multiple offers from top schools and experience in Ivy admissions offices."
            ctaHref="/team"
            ctaLabel="Meet the full team"
          />
        </section>

        {/* ── 8. ACCEPTANCES ──────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[8] = el; }}
          id="acceptances"
          className="scroll-snap-section section-reveal flex min-h-[100svh] items-center bg-white/50"
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

        {/* ── 9. TESTIMONIALS ─────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[9] = el; }}
          id="testimonials"
          className="scroll-snap-section section-reveal min-h-[100svh] py-24"
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
                      ? "border-zinc-300 bg-zinc-50"
                      : "border-zinc-200 bg-white"
                  }`}
                >
                  <blockquote className="flex-1 text-base leading-relaxed text-zinc-600">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-zinc-200" />
                    <p className="text-xs font-medium text-zinc-400">
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

        {/* ── 10. CTA ─────────────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[10] = el; }}
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
                  href="/academy/pricing"
                  className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-8 py-4 text-base font-medium text-white hover:bg-zinc-800"
                >
                  Book a session
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}

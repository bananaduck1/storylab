"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TutorStickySection, type Tutor } from "@/components/TutorCard";
import { LogoMarquee } from "@/components/LogoMarquee";
import { AiPreviewWidget } from "@/components/AiPreviewWidget";
import type { StorefrontContent, CaseStudy as StorefrontCaseStudy, PhilosophyStep } from "@/lib/types/storefront";

// ─── Internal Case Study shape (used by modal) ────────────────────────────────

interface CaseStudy {
  index: number;
  initial: string;
  name: string;
  outcome: string;
  color: string;
  teaser: string;
  fullTitle: string;
  fullBefore: string;
  fullAfter: string;
}

const CASE_STUDY_COLORS = ["bg-[#2C4A3E]", "bg-[#2A3F5A]", "bg-[#3A4A2A]"];

function mapCaseStudies(raw: StorefrontCaseStudy[]): CaseStudy[] {
  return raw.map((cs, i) => ({
    index: i,
    initial: cs.student_label.charAt(0).toUpperCase(),
    name: cs.student_label,
    outcome: cs.outcome,
    color: CASE_STUDY_COLORS[i % CASE_STUDY_COLORS.length],
    teaser: cs.teaser,
    fullTitle: cs.student_label,
    fullBefore: cs.challenge,
    fullAfter: cs.what_changed,
  }));
}

// ─── Static data (platform-level, not teacher-specific) ──────────────────────

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
  { id: "founder", label: "My Story" },
  { id: "thesis", label: "My Mission" },
  { id: "philosophy", label: "Philosophy" },
  { id: "why", label: "Why It Matters" },
  { id: "cases", label: "Student Stories" },
  { id: "acceptances", label: "Acceptances" },
  { id: "testimonials", label: "What Families Say" },
  { id: "paths", label: "My Offerings" },
  { id: "preview", label: "Try My AI Coach" },
];

// ─── Case Study Modal ─────────────────────────────────────────────────────────

function CaseStudyModal({
  student,
  onClose,
}: {
  student: CaseStudy;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`${student.name}'s case study`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white px-8 py-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${student.color} text-sm font-semibold text-white`}>
              {student.initial}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">{student.name}</p>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-medium text-emerald-700">
                {student.outcome}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-8 space-y-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 mb-3">
              The problem
            </p>
            <h2
              className="text-2xl font-semibold tracking-tight text-zinc-950 mb-5"
              style={{ fontFamily: "var(--font-cooper, serif)" }}
            >
              {student.fullTitle}
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-zinc-600 whitespace-pre-line">
              {student.fullBefore}
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2C4A3E] mb-3">
              What changed
            </p>
            <div className="space-y-4 text-base leading-relaxed text-zinc-700 whitespace-pre-line">
              {student.fullAfter}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

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

function PhilosophyScrollSection({
  sectionRefCallback,
  steps,
}: {
  sectionRefCallback: (el: HTMLElement | null) => void;
  steps: PhilosophyStep[];
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

  const stepA = steps[0];
  const stepB = steps[1];

  // Render plain text body as paragraphs
  function renderBody(body: string) {
    return body.split("\n\n").map((para, i) => (
      <p key={i} className="text-base leading-relaxed text-zinc-600">
        {para}
      </p>
    ));
  }

  function renderBodyDiff(body: string) {
    return body.split("\n\n").map((para, i) => (
      <p key={i} className="text-base leading-relaxed text-zinc-700">
        {para}
      </p>
    ));
  }

  // Fallback photos if not in data
  const photoA = stepA?.photo_url ?? "/in%20the%20crowd.png";
  const photoB = stepB?.photo_url ?? "/photo-1.png";
  const labelA = stepA?.label ?? "My Philosophy";
  const labelB = stepB?.label ?? "How I'm Different";

  return (
    <section
      ref={setRef}
      id="philosophy"
      className="scroll-snap-section section-reveal relative md:h-[300vh]"
    >
      <div className="md:hidden px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
            My Approach
          </p>
          {stepA && (
            <>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                {labelA}
              </p>
              <div className="relative mt-4 mb-4 h-80 overflow-hidden rounded-xl">
                <Image src={photoA} alt="" fill className="object-contain" />
              </div>
              <div className="mt-2 space-y-4">
                {renderBody(stepA.body)}
              </div>
            </>
          )}
          {stepB && (
            <>
              <div className="my-10 border-t border-zinc-200" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                {labelB}
              </p>
              <div className="relative mt-4 mb-4 h-80 overflow-hidden rounded-xl">
                <Image src={photoB} alt="" fill className="object-contain" />
              </div>
              <div className="mt-2 space-y-4">
                {renderBodyDiff(stepB.body)}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="hidden md:flex sticky top-0 h-screen items-center">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="grid grid-cols-[2fr_3fr] items-center gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                My Approach
              </p>
              <div className="mt-4" style={{ display: "grid" }}>
                <h2
                  style={{ gridArea: "1 / 1" }}
                  className={`text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl transition-opacity duration-[250ms] ${
                    step === 0 ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {labelA}
                </h2>
                <h2
                  style={{ gridArea: "1 / 1" }}
                  className={`text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl transition-opacity duration-[250ms] ${
                    step === 1 ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {labelB}
                </h2>
              </div>
              <div className="mt-6" style={{ display: "grid" }}>
                <div
                  style={{ gridArea: "1 / 1" }}
                  className={`relative h-80 overflow-hidden rounded-xl transition-opacity duration-[250ms] ${
                    step === 0 ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Image src={photoA} alt="" fill className="object-contain" />
                </div>
                <div
                  style={{ gridArea: "1 / 1" }}
                  className={`relative h-80 overflow-hidden rounded-xl transition-opacity duration-[250ms] ${
                    step === 1 ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Image src={photoB} alt="" fill className="object-contain" />
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <div className={`h-2 w-2 rounded-full transition-colors duration-[250ms] ${step === 0 ? "bg-zinc-900" : "bg-zinc-200"}`} />
                <div className={`h-2 w-2 rounded-full transition-colors duration-[250ms] ${step === 1 ? "bg-zinc-900" : "bg-zinc-200"}`} />
              </div>
            </div>
            <div style={{ display: "grid" }}>
              {stepA && (
                <div
                  style={{ gridArea: "1 / 1" }}
                  className={`space-y-4 transition-all duration-[250ms] ease-out ${
                    step === 0 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
                  }`}
                >
                  {renderBody(stepA.body)}
                </div>
              )}
              {stepB && (
                <div
                  style={{ gridArea: "1 / 1" }}
                  className={`space-y-4 transition-all duration-[250ms] ease-out ${
                    step === 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                  }`}
                >
                  {renderBodyDiff(stepB.body)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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
      <div className="md:hidden px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Why It Matters</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
            Preparing for college is preparing for the real world.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-500">
            In an era where AI can perform most technical skills, the people who succeed are the ones who can think clearly, write persuasively, and make meaning. I train that.
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-3xl space-y-10 px-6">
          <div>
            <div className="mb-5 relative h-56 w-full overflow-hidden rounded-xl opacity-80">
              <Image src="/daniela%20amodei.png" alt="Daniela Amodei" fill className="object-cover" />
            </div>
            <blockquote className="text-xl italic leading-relaxed text-zinc-700">
              <strong className="not-italic font-semibold text-zinc-900">
                I actually think studying the humanities is going to be more important than ever.
              </strong>{" "}
              A lot of these [AI] models are actually very good at STEM. But I think this idea that there are things that make us uniquely human — understanding ourselves, understanding history, understanding what makes us tick — I think that will always be really, really important.
            </blockquote>
            <div className="mt-5 flex items-center gap-3">
              <div className="h-px w-8 bg-zinc-300" />
              <p className="text-xs text-zinc-400">Daniela Amodei, President of Anthropic</p>
            </div>
          </div>
          <div>
            <div className="mb-5 relative h-56 w-full overflow-hidden rounded-xl">
              <Image src="/jamie%20dimon.png" alt="Jamie Dimon" fill className="object-cover" />
            </div>
            <blockquote className="text-xl italic leading-relaxed text-zinc-700">
              My advice to people would be critical thinking, learn skills, learn your EQ, learn how to be good in a meeting,{" "}
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

      <div className="hidden md:flex sticky top-0 h-screen items-center px-6">
        <div className="w-full max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Why It Matters</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Preparing for college is preparing for the real world.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-500">
              In an era where AI can perform most technical skills, the people who succeed are the ones who can think clearly, write persuasively, and make meaning. I train that.
            </p>
          </div>
          <div style={{ display: "grid" }}>
            <div
              style={{ gridArea: "1 / 1" }}
              className={`transition-all duration-[250ms] ease-out ${step === 0 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}
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
                    A lot of these [AI] models are actually very good at STEM. But I think this idea that there are things that make us uniquely human — understanding ourselves, understanding history, understanding what makes us tick — I think that will always be really, really important.
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-px w-10 bg-zinc-300" />
                    <p className="text-xs text-zinc-400">Daniela Amodei, President of Anthropic</p>
                  </div>
                </div>
              </div>
            </div>
            <div
              style={{ gridArea: "1 / 1" }}
              className={`transition-all duration-[250ms] ease-out ${step === 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
            >
              <div className="grid grid-cols-2 gap-12 items-center">
                <div>
                  <blockquote className="text-2xl italic leading-relaxed text-zinc-700">
                    My advice to people would be critical thinking, learn skills, learn your EQ, learn how to be good in a meeting,{" "}
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
          <div className="mt-8 flex gap-2">
            <div className={`h-2 w-2 rounded-full transition-colors duration-[250ms] ${step === 0 ? "bg-zinc-900" : "bg-zinc-200"}`} />
            <div className={`h-2 w-2 rounded-full transition-colors duration-[250ms] ${step === 1 ? "bg-zinc-900" : "bg-zinc-200"}`} />
          </div>
        </div>
      </div>
    </section>
  );
}

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
            i === activeIndex ? "scale-110 bg-zinc-900" : "bg-zinc-300 hover:bg-zinc-400"
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface TeacherStorefrontContentProps {
  teacherSlug: string;
  teacherName: string;
  teacherBio?: string | null;
  teacherPhotoUrl?: string | null;
  teacherQuote?: string | null;
  teacherSubject?: string | null;
  acceptingBookings?: boolean;
  aiCoachingEnabled?: boolean;
  liveSessionsEnabled?: boolean;
  primaryEmphasis?: 'ai' | 'live' | 'equal';
  storefrontContent?: StorefrontContent | null;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function TeacherStorefrontContent({
  teacherSlug,
  teacherName,
  teacherPhotoUrl,
  teacherSubject,
  acceptingBookings = false,
  storefrontContent,
}: TeacherStorefrontContentProps) {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<CaseStudy | null>(null);

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
      { threshold: 0.2, rootMargin: "-5% 0px -5% 0px" }
    );
    sectionRefs.current.forEach((s) => { if (s) observer.observe(s); });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (idx: number) => {
    sectionRefs.current[idx]?.scrollIntoView({ behavior: "smooth" });
  };

  // Derived data from storefrontContent
  const heroHeadline = storefrontContent?.hero?.headline ?? "Your story is already there. Let me help you find it.";
  const heroSubheadline = storefrontContent?.hero?.subheadline ?? null;
  const storyTitle = storefrontContent?.story?.title ?? `Hi, I'm ${teacherName.split(" ")[0]}.`;
  const storyBody = storefrontContent?.story?.body ?? null;
  const storyPhotoUrl = storefrontContent?.story?.photo_url ?? null;
  const philosophySteps = storefrontContent?.philosophy?.steps ?? [];
  const rawCaseStudies = storefrontContent?.case_studies ?? [];
  const caseStudies = mapCaseStudies(rawCaseStudies);
  const testimonials = storefrontContent?.testimonials ?? [];

  const heroPhoto = teacherPhotoUrl ?? "/tutor%20photos/sam/sam_headshot.jpg";
  const subjectLabel = teacherSubject ?? "Tutor";

  return (
    <>
      <ProgressDots activeIndex={activeIndex} onDotClick={scrollToSection} />

      {/* Case study modal */}
      {selectedStudent && (
        <CaseStudyModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      <div>
        {/* ── 0. HERO ─────────────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[0] = el; }}
          id="hero"
          className="scroll-snap-section section-reveal bg-[#2C4A3E]"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
            <div className="grid items-center gap-12 md:grid-cols-2">
              {/* Left: Photo */}
              <div className="relative aspect-square overflow-hidden rounded-[4px] max-w-sm mx-auto md:max-w-none md:mx-0">
                <Image
                  src={heroPhoto}
                  alt={teacherName}
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>

              {/* Right: Name + CTA */}
              <div>
                <p
                  className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#E8D5B0] mb-4"
                >
                  {subjectLabel}
                </p>
                <h1
                  className="text-[clamp(2.4rem,4vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-white mb-4"
                  style={{ fontFamily: "var(--font-cooper, serif)" }}
                >
                  {teacherName}
                </h1>
                {heroSubheadline && (
                  <p
                    className="text-base text-white/70 mb-4"
                    style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
                  >
                    {heroSubheadline}
                  </p>
                )}
                <p
                  className="text-lg italic leading-relaxed text-white/80 mb-8"
                  style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
                >
                  {heroHeadline}
                </p>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="#preview"
                    aria-label="Try a free message"
                    className="inline-flex items-center rounded-[3px] bg-white px-6 py-3 text-sm font-medium text-[#2C4A3E] hover:bg-[#DEEEE9] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("preview")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Try a free message →
                  </a>
                  {acceptingBookings && (
                    <Link
                      href={`/teachers/${teacherSlug}/book`}
                      aria-label={`Book a live session with ${teacherName}`}
                      className="inline-flex items-center rounded-[3px] border border-white/60 bg-transparent px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    >
                      Book a session →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 1. MY STORY ─────────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[1] = el; }}
          id="founder"
          className="scroll-snap-section section-reveal flex min-h-[100svh] items-center bg-white/50"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <div className={`grid items-center gap-16 ${storyPhotoUrl ? "md:grid-cols-2" : ""}`}>
              {storyPhotoUrl && (
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl md:order-1">
                  <Image
                    src={storyPhotoUrl}
                    alt={teacherName}
                    fill
                    className="object-cover object-center"
                  />
                </div>
              )}
              <div className={storyPhotoUrl ? "md:order-2" : ""}>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  My Story
                </p>
                <h2 className="mt-5 text-3xl font-semibold leading-[1.2] tracking-tight text-zinc-950 sm:text-4xl">
                  {storyTitle}
                </h2>
                {storyBody ? (
                  <div className="mt-6 space-y-4 text-base leading-relaxed text-zinc-600">
                    {storyBody.split("\n\n").map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                ) : null}
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
            <div className="flex items-center px-8 py-6 md:px-16">
              <p className="text-4xl font-bold leading-tight tracking-tight text-zinc-950 sm:text-5xl">
                In an application field where it&rsquo;s harder to stand out than ever, I give
                students the tools to tell a killer story.
              </p>
            </div>
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
          steps={philosophySteps}
        />

        {/* ── 4. WHY IT MATTERS (scroll-driven) ───────────────────────── */}
        <WhyItMattersScrollSection
          sectionRefCallback={(el) => { sectionRefs.current[4] = el; }}
        />

        {/* ── 5. STUDENT STORIES ──────────────────────────────────────── */}
        {caseStudies.length > 0 && (
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
                  Meet some of my students.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-zinc-500">
                  Every student who arrives has something real to say. They just haven&rsquo;t found it&nbsp;yet.
                </p>
              </div>

              <div className="mt-14 grid gap-6 md:grid-cols-3">
                {caseStudies.map((s) => (
                  <button
                    key={s.index}
                    onClick={() => setSelectedStudent(s)}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left transition-all hover:border-zinc-300 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40"
                  >
                    <div className="flex items-center gap-4 border-b border-zinc-100 px-6 py-5">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${s.color} text-base font-semibold text-white`}>
                        {s.initial}
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900">{s.name}</p>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <p className="flex-1 text-sm leading-relaxed text-zinc-600">{s.teaser}</p>
                      <div className="mt-8 flex items-center justify-between">
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700">
                          {s.outcome}
                        </span>
                        <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-700 transition-colors">
                          Read story →
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 6. ACCEPTANCES ──────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[6] = el; }}
          id="acceptances"
          className="scroll-snap-section section-reveal flex min-h-[100svh] items-center bg-white/50"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-center text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              My students&rsquo; acceptances
            </h2>
            <div className="mt-12">
              <LogoMarquee />
            </div>
          </div>
        </section>

        {/* ── 7. TESTIMONIALS ─────────────────────────────────────────── */}
        {testimonials.length > 0 && (
          <section
            ref={(el) => { sectionRefs.current[7] = el; }}
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
                    className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-8"
                  >
                    <blockquote className="flex-1 text-base leading-relaxed text-zinc-600">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3">
                      <div className="h-px flex-1 bg-zinc-200" />
                      <p className="text-xs font-medium text-zinc-400">{t.attribution}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 8. MY OFFERINGS ─────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[8] = el; }}
          id="paths"
          className="scroll-snap-section section-reveal flex min-h-[100svh] items-center"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl mb-10">
              My Offerings
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  href: `/teachers/${teacherSlug}/humanities`,
                  title: "Humanities Foundations",
                  desc: "Build the skills before you need them.",
                },
                {
                  href: `/teachers/${teacherSlug}/applications`,
                  title: "College Applications",
                  desc: "Grades 11–12. Position and apply with a voice that's already developed.",
                },
                {
                  href: `/teachers/${teacherSlug}/transfer`,
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

        {/* ── 9. AI PREVIEW WIDGET ─────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[9] = el; }}
          id="preview"
          className="scroll-snap-section section-reveal bg-[#FAFAF8] px-6 py-16 md:py-24"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl mb-10 text-center">
              <p
                className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-3"
              >
                Experience the coaching
              </p>
              <h2
                className="text-2xl font-semibold tracking-tight text-[#1A2E26]"
                style={{ fontFamily: "var(--font-cooper, serif)" }}
              >
                One free message. No account required.
              </h2>
            </div>
            <AiPreviewWidget teacherSlug={teacherSlug} teacherName={teacherName} />
          </div>
        </section>

        {/* ── HIDDEN: OUR TUTORS (not shown on storefront) ────────────── */}
        <section
          className="hidden"
          aria-hidden="true"
        >
          <TutorStickySection
            tutors={tutors}
            headline="Not just Ivy graduates, but Ivy admissions insiders."
            body="Nationally awarded, published writers trained at Harvard and Yale, with multiple offers from top schools and experience in Ivy admissions offices."
            ctaHref="/team"
            ctaLabel="Meet the full team"
          />
        </section>

      </div>
    </>
  );
}

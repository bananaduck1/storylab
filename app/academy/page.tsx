"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TutorStickySection, type Tutor } from "@/components/TutorCard";
import { LogoMarquee } from "@/components/LogoMarquee";

// ─── Data ────────────────────────────────────────────────────────────────────

const caseStudies = [
  {
    initial: "J",
    name: "Jason Lim",
    grade: "Senior",
    profile: "Student body president, certified EMT, 1530 SAT. A kid who had done everything right.",
    applying: "Yale, Columbia, UChicago",
    outcome: "Accepted — UChicago",
    color: "bg-[#2C4A3E]",
    problemTitle: "The Problem",
    problem: [
      <>Jason's first essay read like a <strong className="text-zinc-900 font-semibold">press release about himself</strong>. It hit every note: leadership, service, resilience. By the second paragraph, I could have told you every sentence that was coming. Not because he wasn't an interesting person — because he was writing to impress me instead of talking to me.</>,
      <>His parents read it and said it sounded great. It did sound great. That was the problem. <strong className="text-zinc-900 font-semibold">It sounded like a hundred other essays I'd read that week.</strong></>,
    ],
    solutionTitle: "What We Did",
    solution: [
      <>I asked Jason to stop writing and start talking. What was the most important thing from high school — not the most impressive, the most important? He'd written about EMT training as a story of competence and service. But offhand, almost as an aside, he mentioned his father — a man who'd immigrated here, worked double shifts for twenty years, and never once asked anyone for help. Not because he didn't need it. Because he didn't think he was allowed to.</>,
      <>Jason had spent two years learning to show up for strangers in crisis. That connection was nowhere in his essay. <strong className="text-zinc-900 font-semibold">He hadn't thought it was relevant.</strong> It was the entire essay.</>,
      <>We rebuilt around that tension — not what he'd done as an EMT, but why he'd needed to become one. What it meant to be someone who asks "are you okay?" when the person he most wanted to ask it of would never have let him. <strong className="text-zinc-900 font-semibold">The most specific essay he'd ever written, and the least "impressive."</strong> It got him in.</>,
    ],
    quote: "I kept telling him the essay didn't need to sound better. It needed to sound like him — like the version that thinks about things at 11pm, not the version that answers interview questions.",
  },
  {
    initial: "S",
    name: "Sarah Oh",
    grade: "Senior",
    profile: "Competitive swimmer, 1540 SAT, genuinely excellent writer. Her English teacher called her one of the best students she'd had in years.",
    applying: "Stanford, Yale, Northwestern, Columbia",
    outcome: "Accepted — Northwestern ED",
    color: "bg-[#2A3F5A]",
    problemTitle: "The Problem",
    problem: [
      <>Sarah's essay was beautifully written. Every sentence was clean, controlled, and completely safe. She'd written about discipline and solitude and the meditative quality of early-morning practice in ways that were technically perfect and <strong className="text-zinc-900 font-semibold">emotionally distant</strong>. After reading 600 words, I didn't know her any better than I had at the top of the page.</>,
      <>Her parents were confused when I said the essay wasn't working. It was so well-written. That's the trap: <strong className="text-zinc-900 font-semibold">strong writers can hide behind their own sentences.</strong> Sarah was doing exactly that.</>,
    ],
    solutionTitle: "What We Did",
    solution: [
      <>I stopped asking Sarah to write and asked her to remember. Not what swimming meant to her — what she actually remembered from the most important week of her athletic life. No analysis. Just memory. What came back had almost nothing to do with swimming: <strong className="text-zinc-900 font-semibold">a teammate who'd quit without saying why, a bus ride home after a loss where nobody spoke, the moment she realized she'd been training so hard for so long that she'd forgotten to notice who was beside her.</strong></>,
      <>None of those memories were about performance. All of them were about what years of early mornings had quietly cost her — and what she'd only just started to recover. We rebuilt the essay around that: not what she'd achieved in the water, but what she'd finally learned to do outside of it. <strong className="text-zinc-900 font-semibold">For the first time in the entire process, Sarah cried reading a draft out loud.</strong> That's when we knew we had it.</>,
    ],
    quote: "The essay that got her in wasn't about swimming. It was about the first time she let herself need something other than a best time. The pool was just what made her realize it.",
  },
  {
    initial: "M",
    name: "Mia Kang",
    grade: "Senior",
    profile: "Documentary filmmaker, science olympiad competitor, 34 ACT. Funny, self-deprecating, genuinely talented. Didn't think any of it was interesting enough to write about.",
    applying: "Emory, Georgetown, UVA, Boston University",
    outcome: "Accepted — Emory ED",
    color: "bg-[#3A4A2A]",
    problemTitle: "The Problem",
    problem: [
      <>Mia had been told by her school counselor not to write about filmmaking — it would seem like a hobby, not a serious pursuit. So her early essays circled everything else: a science project, a leadership role, a story about her grandmother. They were fine. <strong className="text-zinc-900 font-semibold">None of them were about the thing that made her, her.</strong></>,
      <>When I asked what she'd do if she couldn't make films, she went quiet. Then said something offhand that stopped me: <strong className="text-zinc-900 font-semibold">"Everyone acts like it's this brave, risky choice. But I don't feel brave. I just feel like I'd be lying if I did anything else."</strong> I told her to write that down. She said it wasn't interesting enough for a college essay.</>,
    ],
    solutionTitle: "What We Did",
    solution: [
      <>We ignored the counselor's advice and wrote about filmmaking — but from the angle she'd never considered. Not "film is my passion." Not "I want to tell stories that matter." Instead: <strong className="text-zinc-900 font-semibold">what it's like to see the world as footage before you've even decided to film it.</strong> The way she'd been doing it since she was eleven, on her phone, for no one. The way her parents watched her do it and smiled in the careful way parents smile when they're quietly worried.</>,
      <>The essay ended on a specific image she found herself, mid-conversation — her bedroom wall covered in index cards, each one a shot she'd planned for a film nobody had asked her to make. <strong className="text-zinc-900 font-semibold">The most honest sentence she'd ever written.</strong> She almost cut it for being "too small." The admissions office brought it up when they called to tell her she'd gotten in.</>,
    ],
    quote: "Mia thought her story wasn't interesting enough to write about. The problem wasn't that it wasn't interesting. The problem was that she'd never been asked the right question.",
  },
];

const philosophy = [
  {
    number: "01",
    belief: "Admissions officers are humanists at heart and value humanities-oriented thinking in the application.",
    difference: "We train students, even those with STEM backgrounds, to infuse humanistic thinking and reflection in their applications.",
  },
  {
    number: "02",
    belief: "Achievements get you in the running. Writing that dares to be emotional and vulnerable gets you admitted.",
    difference: "We push students beyond surface-level \"I-learned-x\" sentences to write radically vulnerable narratives admissions officers can't forget.",
  },
  {
    number: "03",
    belief: "Writing is an opaque and difficult process that takes months, if not years, to see results. AI tools only make you less distinguishable.",
    difference: "We teach students the process of writing itself, which sets them up for success long after the admissions process is over.",
  },
  {
    number: "04",
    belief: "By 12th grade, many parts of the application are too late to change. Starting as early as possible to craft a unique narrative is a must.",
    difference: "Long before 12th grade, we push students away from cliché narratives and coach them to build strong relationships with teachers.",
  },
];

const testimonials = [
  {
    quote: "Working with Sam was one of the most important factors in my college application process. His feedback was specific, personalized, and genuinely insightful — far beyond what I received from my school counselor. He didn't just comment on my ideas broadly; he engaged with individual sentences, pushing me to sharpen my thinking and present myself as clearly and authentically as possible. His dedication made a real difference. I felt supported throughout the entire process, and my essays became something I was truly proud of.",
    attribution: "Student attending University of Chicago",
    type: "student",
  },
  {
    quote: "What stood out immediately was how broadly experienced he is. Whatever I brought to the table — my academic interests, my extracurriculars — he had enough background to understand where I was coming from and give feedback that actually resonated. His feedback was always sharp and constructive. When my early drafts weren't working, he didn't just tell me what was wrong — he pushed me toward something more sincere and more genuinely me. The most important lesson I took: write logically and authentically. Don't jump around, and don't over-flex. Your activities list already speaks for itself — your essays should reveal who you actually are.",
    attribution: "Student attending Northwestern",
    type: "student",
  },
  {
    quote: "The college application process is stressful and time-consuming — but working with Sam made it genuinely manageable. What set our sessions apart was how collaborative and intentional they were. We spent real time talking through ideas, building a clear game plan for my essays and deadlines. I always left feeling like I knew exactly what I was working toward. But what I want to emphasize most is Sam's genuine sense of care. He communicated consistently, gave thoughtful feedback, and made the whole process feel less like a grind and more like something I could actually be proud of.",
    attribution: "Student attending Vanderbilt",
    type: "student",
  },
  {
    quote: "As my daughter's college application season approached, I sought out the best essay tutor who could truly understand and support her — someone who could see her. Meeting Sam turned out to be one of the greatest blessings for both of us. After just the first session, my daughter had already placed complete trust in him and felt genuinely confident that she could do this. He also checked in on me regularly with warm, encouraging messages — he wasn't just a support system for my daughter, but for me as a worried parent as well. Sam is a teacher who truly listens to what a student is wrestling with and draws out exactly what they need.",
    attribution: "Parent of a student admitted to her dream school",
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
  { id: "founder", label: "Our Story" },
  { id: "cases", label: "Student Stories" },
  { id: "paths", label: "Programs" },
  { id: "tutors", label: "Our Team" },
  { id: "philosophy", label: "Why It Matters" },
  { id: "testimonials", label: "Results" },
  { id: "acceptances", label: "Acceptances" },
  { id: "cta", label: "Get Started" },
];

// ─── Nav dots ─────────────────────────────────────────────────────────────────

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
            const idx = sectionRefs.current.findIndex((ref) => ref === entry.target);
            if (idx !== -1) setActiveIndex(idx);
          }
        });
      },
      { threshold: 0.35, rootMargin: "-10% 0px -10% 0px" }
    );
    sectionRefs.current.forEach((s) => { if (s) observer.observe(s); });
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
                  <Link href="/results" className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800">
                    See results
                  </Link>
                  <Link href="/contact" className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                    Schedule a consultation
                  </Link>
                </div>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image src="/photo-1.png" alt="Students working together" fill className="object-cover" priority />
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
                <Image src="/photo-1.png" alt="Sam Ahn" fill className="object-cover object-top" />
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

        {/* ── 2. CASE STUDIES ─────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[2] = el; }}
          id="cases"
          className="scroll-snap-section section-reveal min-h-[100svh] py-24"
        >
          <div className="mx-auto w-full max-w-6xl px-6">
            {/* Header */}
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                Student Stories
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                Three students.<br />Three different problems.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-500">
                Every student who arrives at StoryLab has something real to say. They just haven&rsquo;t found it yet.
              </p>
            </div>

            {/* Cards */}
            <div className="mt-14 space-y-6">
              {caseStudies.map((s) => (
                <div key={s.name} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                  {/* Card header */}
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-zinc-100 px-8 py-5 sm:grid-cols-[auto_1fr_auto_auto]">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${s.color} text-base font-semibold text-white`}>
                      {s.initial}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900">{s.name}</p>
                      <p className="text-xs text-zinc-400">{s.grade} &middot; {s.applying}</p>
                    </div>
                    <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:inline-block">
                      {s.outcome}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="grid gap-0 md:grid-cols-2">
                    {/* Problem */}
                    <div className="border-b border-zinc-100 p-8 md:border-b-0 md:border-r">
                      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-rose-400">
                        The Problem
                      </p>
                      <div className="space-y-3">
                        {s.problem.map((para, i) => (
                          <p key={i} className="text-sm leading-relaxed text-zinc-600">{para}</p>
                        ))}
                      </div>
                    </div>

                    {/* Solution */}
                    <div className="p-8">
                      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                        What We Did
                      </p>
                      <div className="space-y-3">
                        {s.solution.map((para, i) => (
                          <p key={i} className="text-sm leading-relaxed text-zinc-600">{para}</p>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pull quote */}
                  <div className="border-t border-zinc-100 bg-zinc-50/60 px-8 py-5">
                    <p className="text-sm italic leading-relaxed text-zinc-500">
                      &ldquo;{s.quote}&rdquo;
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-8 text-xs text-zinc-400">
              Names and identifying details have been changed.{" "}
              <em>The essays — and the moments that produced them — are real.</em>
            </p>
          </div>
        </section>

        {/* ── 3. THREE PATHS ──────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[3] = el; }}
          id="paths"
          className="scroll-snap-section section-reveal flex min-h-[100svh] items-center bg-white/50"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Three paths. One foundation.
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                { href: "/academy/humanities", title: "Humanities Foundations", desc: "Grades 7–11. Build the skills before you need them." },
                { href: "/academy/applications", title: "College Applications", desc: "Grades 11–12. Position and apply with a voice that's already developed." },
                { href: "/academy/transfer", title: "Transfer Applications", desc: "College students. A second chance to get the story right." },
              ].map((p) => (
                <Link key={p.href} href={p.href} className="group rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:border-zinc-300 hover:shadow-lg">
                  <h3 className="text-xl font-semibold tracking-tight text-zinc-950 group-hover:text-zinc-700">{p.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-zinc-600">{p.desc}</p>
                  <p className="mt-4 text-sm font-medium text-zinc-400 group-hover:text-zinc-700">Learn more →</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. OUR TUTORS ───────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[4] = el; }}
          id="tutors"
          className="scroll-snap-section section-reveal min-h-[100svh] py-16"
        >
          <TutorStickySection
            tutors={tutors}
            headline="Not just Ivy graduates, but Ivy admissions insiders."
            body="Nationally awarded, published writers trained at Harvard and Yale, with multiple offers from top schools and experience in Ivy admissions offices."
            ctaHref="/team"
            ctaLabel="Meet the full team"
          />
        </section>

        {/* ── 5. PHILOSOPHY / WHY IT MATTERS ─────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[5] = el; }}
          id="philosophy"
          className="scroll-snap-section section-reveal min-h-[100svh] bg-white/50 py-24"
        >
          <div className="mx-auto w-full max-w-6xl px-6">

            {/* Headline */}
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

            {/* Philosophy + Difference table */}
            <div className="mt-14">
              {/* Column labels */}
              <div className="mb-4 hidden grid-cols-2 gap-6 md:grid">
                <p className="pl-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Our Philosophy</p>
                <p className="pl-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">The StoryLab Difference</p>
              </div>

              <div className="space-y-3">
                {philosophy.map((item) => (
                  <div key={item.number} className="grid gap-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white md:grid-cols-2">
                    <div className="flex gap-5 border-b border-zinc-100 p-6 md:border-b-0 md:border-r">
                      <span className="mt-0.5 flex-shrink-0 text-xs font-bold text-zinc-300">{item.number}</span>
                      <p className="text-sm leading-relaxed text-zinc-600">{item.belief}</p>
                    </div>
                    <div className="flex gap-5 bg-zinc-50/50 p-6">
                      <span className="mt-0.5 flex-shrink-0 text-xs font-bold text-emerald-400">{item.number}</span>
                      <p className="text-sm leading-relaxed text-zinc-700">{item.difference}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Two authority quotes */}
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              <figure className="rounded-2xl border border-zinc-200 bg-white p-8">
                <blockquote className="text-base leading-relaxed text-zinc-700">
                  <span className="text-2xl leading-none text-zinc-200">&ldquo;</span>
                  I actually think studying the humanities is going to be{" "}
                  <strong className="font-semibold text-zinc-900">more important than ever.</strong>{" "}
                  A lot of these [AI] models are actually very good at STEM. But I think this idea that there are things that make us uniquely human — understanding ourselves, understanding history, understanding what makes us tick — I think that will always be really, really important.
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-zinc-100" />
                  <p className="text-xs font-medium text-zinc-500">Daniela Amodei, President of Anthropic</p>
                </figcaption>
              </figure>

              <figure className="rounded-2xl border border-zinc-200 bg-white p-8">
                <blockquote className="text-base leading-relaxed text-zinc-700">
                  <span className="text-2xl leading-none text-zinc-200">&ldquo;</span>
                  My advice to people would be critical thinking, learn skills, learn your EQ, learn how to be good in a meeting,{" "}
                  <strong className="font-semibold text-zinc-900">how to communicate, how to write. You&rsquo;ll have plenty of jobs.</strong>
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-zinc-100" />
                  <p className="text-xs font-medium text-zinc-500">Jamie Dimon, CEO of JPMorgan Chase</p>
                </figcaption>
              </figure>
            </div>

          </div>
        </section>

        {/* ── 6. TESTIMONIALS ─────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[6] = el; }}
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
                      ? "border-zinc-300 bg-zinc-50 md:col-span-2"
                      : "border-zinc-200 bg-white"
                  }`}
                >
                  <blockquote className="flex-1 text-base leading-relaxed text-zinc-600">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-zinc-200" />
                    <p className={`text-xs font-medium ${t.type === "parent" ? "text-zinc-600" : "text-zinc-400"}`}>
                      {t.attribution}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link href="/results" className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                See all results
              </Link>
            </div>
          </div>
        </section>

        {/* ── 7. ACCEPTANCES ──────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[7] = el; }}
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

        {/* ── 8. CTA ──────────────────────────────────────────────────── */}
        <section
          ref={(el) => { sectionRefs.current[8] = el; }}
          id="cta"
          className="scroll-snap-section section-reveal flex min-h-[100svh] items-center"
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
                <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-8 py-4 text-base font-medium text-white hover:bg-zinc-800">
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

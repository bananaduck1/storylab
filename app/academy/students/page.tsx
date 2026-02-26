"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// ─── Data ────────────────────────────────────────────────────────────────────

const students = [
  {
    slug: "jason",
    initial: "J",
    name: "Jason",
    grade: "Senior",
    applying: "Yale, Columbia, UChicago",
    outcome: "Accepted — UChicago",
    color: "bg-[#2C4A3E]",
    problem: {
      paragraphs: [
        "Jason's first essay read like a press release about himself. It hit every note: leadership, service, resilience. By the second paragraph, I could have told you every sentence that was coming. Not because he wasn't an interesting person — because he was writing to impress me instead of talking to me.",
        "His parents read it and said it sounded great. It did sound great. That was the problem. It sounded like a hundred other essays I'd read that week.",
      ],
    },
    solution: {
      paragraphs: [
        "I asked Jason to stop writing and start talking. What was the most important thing from high school — not the most impressive, the most important? He'd written about EMT training as a story of competence and service. But offhand, almost as an aside, he mentioned his father — a man who'd immigrated here, worked double shifts for twenty years, and never once asked anyone for help. Not because he didn't need it. Because he didn't think he was allowed to.",
        "Jason had spent two years learning to show up for strangers in crisis. That connection was nowhere in his essay. He hadn't thought it was relevant. It was the entire essay.",
        "We rebuilt around that tension — not what he'd done as an EMT, but why he'd needed to become one. What it meant to be someone who asks \"are you okay?\" when the person he most wanted to ask it of would never have let him. The most specific essay he'd ever written, and the least \"impressive.\" It got him in.",
      ],
    },
    quote:
      "I kept telling him the essay didn't need to sound better. It needed to sound like him — like the version that thinks about things at 11pm, not the version that answers interview questions.",
  },
  {
    slug: "sarah",
    initial: "S",
    name: "Sarah",
    grade: "Senior",
    applying: "Stanford, Yale, Northwestern, Columbia",
    outcome: "Accepted — Northwestern ED",
    color: "bg-[#2A3F5A]",
    problem: {
      paragraphs: [
        "Sarah's essay was beautifully written. Every sentence was clean, controlled, and completely safe. She'd written about discipline and solitude and the meditative quality of early-morning practice in ways that were technically perfect and emotionally distant. After reading 600 words, I didn't know her any better than I had at the top of the page.",
        "Her parents were confused when I said the essay wasn't working. It was so well-written. That's the trap: strong writers can hide behind their own sentences. Sarah was doing exactly that.",
      ],
    },
    solution: {
      paragraphs: [
        "I stopped asking Sarah to write and asked her to remember. Not what swimming meant to her — what she actually remembered from the most important week of her athletic life. No analysis. Just memory. What came back had almost nothing to do with swimming: a teammate who'd quit without saying why, a bus ride home after a loss where nobody spoke, the moment she realized she'd been training so hard for so long that she'd forgotten to notice who was beside her.",
        "None of those memories were about performance. All of them were about what years of early mornings had quietly cost her — and what she'd only just started to recover. We rebuilt the essay around that: not what she'd achieved in the water, but what she'd finally learned to do outside of it. For the first time in the entire process, Sarah cried reading a draft out loud. That's when we knew we had it.",
      ],
    },
    quote:
      "The essay that got her in wasn't about swimming. It was about the first time she let herself need something other than a best time. The pool was just what made her realize it.",
  },
  {
    slug: "mia",
    initial: "M",
    name: "Mia",
    grade: "Senior",
    applying: "Emory, Georgetown, UVA, Boston University",
    outcome: "Accepted — Emory ED",
    color: "bg-[#3A4A2A]",
    problem: {
      paragraphs: [
        "Mia had been told by her school counselor not to write about filmmaking — it would seem like a hobby, not a serious pursuit. So her early essays circled everything else: a science project, a leadership role, a story about her grandmother. They were fine. None of them were about the thing that made her, her.",
        "When I asked what she'd do if she couldn't make films, she went quiet. Then said something offhand that stopped me: \"Everyone acts like it's this brave, risky choice. But I don't feel brave. I just feel like I'd be lying if I did anything else.\" I told her to write that down. She said it wasn't interesting enough for a college essay.",
      ],
    },
    solution: {
      paragraphs: [
        "We ignored the counselor's advice and wrote about filmmaking — but from the angle she'd never considered. Not \"film is my passion.\" Not \"I want to tell stories that matter.\" Instead: what it's like to see the world as footage before you've even decided to film it. The way she'd been doing it since she was eleven, on her phone, for no one. The way her parents watched her do it and smiled in the careful way parents smile when they're quietly worried.",
        "The essay ended on a specific image she found herself, mid-conversation — her bedroom wall covered in index cards, each one a shot she'd planned for a film nobody had asked her to make. The most honest sentence she'd ever written. She almost cut it for being \"too small.\" The admissions office brought it up when they called to tell her she'd gotten in.",
      ],
    },
    quote:
      "Mia thought her story wasn't interesting enough to write about. The problem wasn't that it wasn't interesting. The problem was that she'd never been asked the right question.",
  },
];

// ─── Inner component (needs useSearchParams) ─────────────────────────────────

function StudentsContent() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("student") ?? "jason";
  const validSlug = students.find((s) => s.slug === initialSlug)
    ? initialSlug
    : "jason";

  const [activeSlug, setActiveSlug] = useState(validSlug);
  const student = students.find((s) => s.slug === activeSlug) ?? students[0];

  return (
    <div className="bg-transparent">
      <div className="mx-auto w-full max-w-4xl px-6 py-16 sm:py-20">

        {/* Back link */}
        <Link
          href="/academy#cases"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-700"
        >
          ← Back
        </Link>

        {/* Student switcher */}
        <div className="mt-8 flex gap-2">
          {students.map((s) => (
            <button
              key={s.slug}
              onClick={() => setActiveSlug(s.slug)}
              className={`flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                s.slug === activeSlug
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
              }`}
            >
              <span
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${s.color}`}
              >
                {s.initial}
              </span>
              {s.name}
            </button>
          ))}
        </div>

        {/* Active student */}
        <div className="mt-10">

          {/* Header */}
          <div className="flex items-center gap-5">
            <div
              className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full ${student.color} text-xl font-semibold text-white`}
            >
              {student.initial}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                {student.name}
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                {student.grade}
              </p>
            </div>
          </div>

          {/* Outcome */}
          <div className="mt-5">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
              {student.outcome}
            </span>
          </div>

          {/* Case study */}
          <div className="mt-10 space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-8">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-rose-400">
                The Problem
              </p>
              <div className="space-y-4">
                {student.problem.paragraphs.map((para, i) => (
                  <p key={i} className="text-base leading-relaxed text-zinc-600">
                    {para}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-8">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                What We Did
              </p>
              <div className="space-y-4">
                {student.solution.paragraphs.map((para, i) => (
                  <p key={i} className="text-base leading-relaxed text-zinc-600">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Pull quote */}
          <figure className="mt-8 rounded-2xl border border-zinc-100 bg-zinc-50 px-8 py-6">
            <blockquote className="text-base italic leading-relaxed text-zinc-500">
              &ldquo;{student.quote}&rdquo;
            </blockquote>
          </figure>

          {/* CTA */}
          <div className="mt-14 rounded-3xl border border-zinc-200 bg-white p-8 text-center sm:p-10">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Find your story.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-600">
              Every student has one. Schedule a consultation to start finding yours.
            </p>
            <div className="mt-8">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-7 py-3 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Schedule a consultation
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  return (
    <Suspense>
      <StudentsContent />
    </Suspense>
  );
}

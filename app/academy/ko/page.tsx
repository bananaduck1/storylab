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
    grade: "고3",
    applying: "Yale, Columbia, Dartmouth",
    outcome: "합격 — 다트머스",
    color: "bg-[#2C4A3E]",
    teaser:
      "그의 첫 번째 에세이는 모든 항목을 담고 있었습니다: 리더십, 봉사, 회복력. 두 번째 단락부터는 다음 문장이 예측될 정도였습니다. 그것이 바로 문제였습니다.",
  },
  {
    slug: "sarah",
    initial: "S",
    name: "Sarah",
    grade: "고3",
    applying: "Stanford, Yale, Northwestern, Columbia",
    outcome: "합격 — 프린스턴",
    color: "bg-[#2A3F5A]",
    teaser:
      "그녀의 에세이는 아름답게 쓰여졌습니다 — 깔끔하고, 절제되어 있으며, 감정적으로 거리가 있었습니다. 600단어를 읽고 나서도 첫 줄에서보다 그녀를 더 잘 알지 못했습니다.",
  },
  {
    slug: "mia",
    initial: "M",
    name: "Mia",
    grade: "고3",
    applying: "Emory, Georgetown, UVA, Boston University",
    outcome: "합격 — 노스웨스턴",
    color: "bg-[#3A4A2A]",
    teaser:
      "그녀의 카운슬러는 영화 제작에 대해 쓰지 말라고 했습니다. 그래서 그녀는 다른 모든 것에 대해 썼습니다 — 하지만 그 무엇도 진정한 그녀를 보여주지 못했습니다.",
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
        입학 사정관은{" "}
        <strong className="font-semibold text-zinc-900">본질적으로 인문학자</strong>이며,
        지원서에서 인문학적 사고를 높이 평가합니다.
      </>
    ),
    difference: (
      <>
        우리는 STEM 배경의 학생들을 포함한 모든 학생들이 지원서에{" "}
        <strong className="font-semibold text-emerald-800">인문학적 사고와 성찰</strong>을
        담을 수 있도록 훈련합니다.
      </>
    ),
  },
  {
    number: "02",
    belief: (
      <>
        성취는 경쟁에 참여하게 해줍니다.{" "}
        <strong className="font-semibold text-zinc-900">감정적이고 취약함</strong>을
        담을 용기가 있는 글이 합격을 이끕니다.
      </>
    ),
    difference: (
      <>
        우리는 학생들이 표면적인 &lsquo;나는 X를 배웠다&rsquo; 문장을 넘어서, 입학 사정관이 잊을 수 없는{" "}
        <strong className="font-semibold text-emerald-800">진정으로 솔직한 이야기</strong>를
        쓸 수 있도록 이끕니다.
      </>
    ),
  },
  {
    number: "03",
    belief: (
      <>
        글쓰기는 불투명하고 어려운 과정으로, 결과를 보기까지{" "}
        <strong className="font-semibold text-zinc-900">몇 달, 심지어 몇 년</strong>이
        걸립니다. AI 도구는 오히려 당신을{" "}
        <strong className="font-semibold text-zinc-900">더 평범하게</strong> 만들 뿐입니다.
      </>
    ),
    difference: (
      <>
        우리는 학생들에게{" "}
        <strong className="font-semibold text-emerald-800">글쓰기 과정 자체</strong>를
        가르칩니다. 이는 입시가 끝난 후에도 오랫동안 성공의 토대가 됩니다.
      </>
    ),
  },
  {
    number: "04",
    belief: (
      <>
        고3이 되면 지원서의 많은 부분을 바꾸기에 너무 늦습니다.{" "}
        <strong className="font-semibold text-zinc-900">가능한 한 일찍</strong> 시작하여{" "}
        <strong className="font-semibold text-zinc-900">독특한 이야기</strong>를
        만드는 것이 필수입니다.
      </>
    ),
    difference: (
      <>
        고3이 되기 훨씬 전부터, 우리는 학생들이{" "}
        <strong className="font-semibold text-emerald-800">진부한 이야기</strong>에서
        벗어나{" "}
        <strong className="font-semibold text-emerald-800">선생님과 깊은 관계</strong>를
        구축하도록 돕습니다.
      </>
    ),
  },
];

const testimonials = [
  {
    quote:
      "그는 단지 제 아이디어에 대해 폭넓게 언급하는 것에 그치지 않았습니다; 개별 문장에 집중하며 제 생각을 날카롭게 다듬고 최대한 명확하고 진실하게 저 자신을 표현할 수 있도록 이끌어주었습니다.",
    attribution: "시카고 대학교 재학 중인 학생",
    type: "student",
  },
  {
    quote:
      "여러분의 활동 목록은 이미 스스로 말해줍니다 — 에세이는 여러분이 실제로 어떤 사람인지를 보여주어야 합니다. Sam은 제 이야기를 진정으로 제 것으로 만드는 것이 무엇인지 찾는 데 도움을 주었습니다.",
    attribution: "노스웨스턴 대학교 재학 중인 학생",
    type: "student",
  },
  {
    quote:
      "가장 강조하고 싶은 것은 Sam의 진정한 배려심입니다. 그는 꾸준히 소통하고, 사려 깊은 피드백을 제공하며, 전체 과정을 고된 일이 아닌 실제로 자랑스러울 수 있는 일로 느끼게 해주었습니다. 어머니도 눈치채셨습니다 — 그의 따뜻하고 격려하는 메시지들이 과정 내내 어머니께 큰 의미가 있었습니다. 어떤 면에서는 입시 시즌이 저보다 어머니께 더 힘들었는데, Sam은 어머니도 지지받는다고 느낄 수 있게 해주었습니다.",
    attribution: "밴더빌트 대학교 재학 중인 학생",
    type: "student",
  },
  {
    quote:
      "Sam은 학생이 씨름하는 것을 진정으로 듣고 그들에게 필요한 것을 정확히 이끌어내는 선생님입니다. 그와 함께하는 모든 가정의 자녀가 건강하고 안정적이며 심지어 행복한 마음가짐으로 대학 입시 과정을 거칠 것이라고 확신합니다.",
    attribution: "워싱턴 대학교 세인트루이스 학생의 학부모",
    type: "parent",
  },
];

const tutors: Tutor[] = [
  {
    id: "sam",
    name: "Sam Ahn",
    title: "창립자 및 수석 코치",
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
    title: "수석 글쓰기 코치",
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
    title: "지원 전략가",
    headshotSrc: "/tutor%20photos/maren/maren_headshot.jpeg",
    actionSrc: "/tutor%20photos/maren/maren_headshot.jpeg",
    shortBio:
      "Harvard '26, Cambridge '27. Acceptances: Harvard, Yale. President of the Harvard Advocate. Bowdoin Prize recipient and John Harvard Scholar.",
    longBio:
      "Harvard '26, Cambridge '27. Acceptances: Harvard, Yale. President of the Harvard Advocate. Bowdoin Prize recipient and John Harvard Scholar.",
  },
];

const sections = [
  { id: "hero", label: "환영" },
  { id: "founder", label: "우리 이야기" },
  { id: "thesis", label: "우리의 사명" },
  { id: "philosophy", label: "철학" },
  { id: "why", label: "중요한 이유" },
  { id: "cases", label: "학생 이야기" },
  { id: "paths", label: "프로그램" },
  { id: "tutors", label: "우리 팀" },
  { id: "acceptances", label: "합격 현황" },
  { id: "testimonials", label: "결과" },
  { id: "cta", label: "시작하기" },
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
            우리의 접근 방식
          </p>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
            우리의 철학
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
            StoryLab 의 차별점
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
                우리의 접근 방식
              </p>

              {/* Step title (crossfades) */}
              <div className="mt-4" style={{ display: "grid" }}>
                <h2
                  style={{ gridArea: "1 / 1" }}
                  className={`text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl transition-opacity duration-[250ms] ${
                    step === 0 ? "opacity-100" : "opacity-0"
                  }`}
                >
                  우리의 철학
                </h2>
                <h2
                  style={{ gridArea: "1 / 1" }}
                  className={`text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl transition-opacity duration-[250ms] ${
                    step === 1 ? "opacity-100" : "opacity-0"
                  }`}
                >
                  StoryLab 의 차별점
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
            왜 중요한가
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
            대입 준비는 곧 실제 세계를 위한 준비입니다.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-500">
            많은 한국 가정이 학원 방식을 따릅니다 — 성적, 스펙, 수상 실적에 모든 것을 쏟아붓습니다. 하지만 미국 대학 입시에서 실제로 결과를 결정하는 것은 그런 하드 스펙이 아닙니다. 중요한 것은 여러분의 자녀가 어떤 사람인지, 어떻게 생각하는지, 그리고 그들의 이야기가 얼마나 진실하게 전달되는지입니다.
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
                저는 인문학을 공부하는 것이 그 어느 때보다 더 중요해질 것이라고 생각합니다.
              </strong>{" "}
              많은 [AI] 모델들은 실제로 STEM 분야에서 매우 뛰어납니다. 하지만 우리를 인간으로 만드는 것들 — 자신을 이해하고, 역사를 이해하고, 우리를 움직이는 것을 이해하는 것 — 이것들은 항상 매우, 매우 중요할 것이라고 생각합니다.
            </blockquote>
            <div className="mt-5 flex items-center gap-3">
              <div className="h-px w-8 bg-zinc-300" />
              <p className="text-xs text-zinc-400">
                Daniela Amodei, Anthropic 대표이사 (Anthropic: 세계 최고 수준의 AI 연구 기업, Claude AI 개발사)
              </p>
            </div>
          </div>

          {/* Dimon */}
          <div>
            <div className="mb-5 relative h-56 w-full overflow-hidden rounded-xl">
              <Image src="/jamie%20dimon.png" alt="Jamie Dimon" fill className="object-cover" />
            </div>
            <blockquote className="text-xl italic leading-relaxed text-zinc-700">
              제 조언은 비판적 사고를 키우고, 기술을 배우고, 감성 지능을 키우고, 회의에서 좋은 모습을 보이는 법을 배우는 것입니다,{" "}
              <strong className="not-italic font-semibold text-zinc-900">
                소통하는 법을, 쓰는 법을 배우세요. 그러면 일자리는 충분히 있을 것입니다.
              </strong>
            </blockquote>
            <div className="mt-5 flex items-center gap-3">
              <div className="h-px w-8 bg-zinc-300" />
              <p className="text-xs text-zinc-400">Jamie Dimon, JPMorgan Chase 최고경영자</p>
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
              왜 중요한가
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              대입 준비는 곧 실제 세계를 위한 준비입니다.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-500">
              많은 한국 가정이 학원 방식을 따릅니다 — 성적, 스펙, 수상 실적에 모든 것을 쏟아붓습니다. 하지만 미국 대학 입시에서 실제로 결과를 결정하는 것은 그런 하드 스펙이 아닙니다. 중요한 것은 여러분의 자녀가 어떤 사람인지, 어떻게 생각하는지, 그리고 그들의 이야기가 얼마나 진실하게 전달되는지입니다.
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
                      저는 인문학을 공부하는 것이 그 어느 때보다 더 중요해질 것이라고 생각합니다.
                    </strong>{" "}
                    많은 [AI] 모델들은 실제로 STEM 분야에서 매우 뛰어납니다. 하지만 우리를 인간으로 만드는 것들 — 자신을 이해하고, 역사를 이해하고, 우리를 움직이는 것을 이해하는 것 — 이것들은 항상 매우, 매우 중요할 것이라고 생각합니다.
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-px w-10 bg-zinc-300" />
                    <p className="text-xs text-zinc-400">
                      Daniela Amodei, Anthropic 대표이사 (Anthropic: 세계 최고 수준의 AI 연구 기업, Claude AI 개발사)
                    </p>
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
                    제 조언은 비판적 사고를 키우고, 기술을 배우고, 감성 지능을 키우고, 회의에서 좋은 모습을 보이는 법을 배우는 것입니다,{" "}
                    <strong className="not-italic font-semibold text-zinc-900">
                      소통하는 법을, 쓰는 법을 배우세요. 그러면 일자리는 충분히 있을 것입니다.
                    </strong>
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-px w-10 bg-zinc-300" />
                    <p className="text-xs text-zinc-400">Jamie Dimon, JPMorgan Chase 최고경영자</p>
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
      aria-label="섹션 탐색"
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
          aria-label={`${s.label}(으)로 이동`}
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

export default function AcademyPageKo() {
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

        <LanguageSwitcher currentLang="ko" />

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
                  입학 사정관은 본질적으로 인문학적 사고를 합니다. 우리는 학생들이 그들을 위해 쓸 수 있도록 훈련합니다.
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-zinc-600">
                  저희 학생들은 하버드, 예일, 프린스턴, 스탠퍼드 및 기타 최고 대학에 합격했습니다.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/results"
                    className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
                  >
                    결과 보기
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    상담 예약
                  </Link>
                </div>
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
                  창립자 이야기
                </p>
                <h2 className="mt-5 text-3xl font-semibold leading-[1.2] tracking-tight text-zinc-950 sm:text-4xl">
                  안녕하세요, 저는 Sam입니다.
                </h2>
                <div className="mt-6 space-y-4 text-base leading-relaxed text-zinc-600">
                  <p>
                    입시 시즌이 되었을 때, 저는 전국 수상 경력도 없었고, 큰 사회적 영향을 미친 단체를 설립한 것도 아니었습니다. 사회적 운동을 이끈 적도 없었고, 온라인 미디어나 언론에서 찾아볼 수도 없었습니다.
                  </p>
                  <p>
                    최고 대학을 목표로 하는 우수한 학생들의 기준으로 보면, 저는 &ldquo;인상적인&rdquo; 학생이 아니었습니다. 제가 한 것은 좋은 성적을 받고 학교 활동에 참여한 것뿐이었습니다.
                  </p>
                  <p>
                    그런데도 고3 3월에, 하버드, 예일, 스탠퍼드, 프린스턴 — 제가 지원한 모든 학교에 합격했습니다.
                  </p>
                  <p>
                    저는 저를 합격시킨 철학을 학생들에게 가르치기 위해 StoryLab을 시작했습니다.
                  </p>
                  <p>
                    예일에서 최우등으로 졸업하고 Phi Beta Kappa 학술 명예 학회에 가입했으며, 비교문학 학사 학위를 받았습니다. 대학 시절 전 백악관 연설문 작가들과 함께 세계 최대 기업들을 위한 글을 썼으며, 예일 입학처에서 고등학교 3학년 학생들을 평가했습니다.
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
                그 어느 때보다 두각을 나타내기 어려운 입시 경쟁에서, 우리는 학생들에게 강렬한 이야기를 전달할 도구를 제공합니다.
              </p>
            </div>
            {/* Right: supporting copy */}
            <div className="flex items-center justify-center bg-white/60 px-8 py-6 md:px-16">
              <p className="text-center text-xl leading-relaxed text-zinc-600 sm:text-2xl">
                많은 가정들이 시험 점수와 수상 실적 같은 지원서의 &lsquo;딱딱한&rsquo; 부분에 모든 에너지를 쏟는 실수를 범합니다. 하지만 실제로 학생들을 합격시키는 것은 지원서의 &lsquo;부드러운&rsquo; 부분입니다.
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
                학생 이야기
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                저희 학생들을 만나보세요.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-500">
                StoryLab에 오는 모든 학생은 전할 이야기가 있습니다. 아직 찾지 못했을 뿐입니다.
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
              세 가지 경로. 하나의 토대.
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  href: "/academy/humanities",
                  title: "인문학 기초",
                  desc: "7–11학년. 필요하기 전에 실력을 쌓으세요.",
                },
                {
                  href: "/academy/applications",
                  title: "대학 지원",
                  desc: "11–12학년. 이미 개발된 목소리로 포지셔닝하고 지원하세요.",
                },
                {
                  href: "/academy/transfer",
                  title: "편입 지원",
                  desc: "대학생. 이야기를 바로잡을 두 번째 기회.",
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
                    자세히 알아보기 →
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
            headline="아이비리그 졸업생일 뿐만 아니라, 아이비리그 입학 내부자들입니다."
            body="하버드와 예일에서 훈련받은 전국 수상 경력의 출판 작가들로, 최고 대학들에서 복수 합격을 받았으며 아이비리그 입학처 경험이 있습니다."
            ctaHref="/team"
            ctaLabel="전체 팀 만나기"
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
              저희 학생들의 합격 현황
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
                가족들의 이야기
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                그들의 말로 직접.
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
                전체 후기 읽기
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
                매 입시 시즌마다 제한된 수의 학생만 받습니다.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-zinc-600">
                글쓰기는 천천히 발전합니다. 일찍 시작할수록 더 많은 선택지가 생깁니다. 적합성과 타이밍을 논의하기 위해 상담을 예약하세요.
              </p>
              <div className="mt-10">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-8 py-4 text-base font-medium text-white hover:bg-zinc-800"
                >
                  상담 예약
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}

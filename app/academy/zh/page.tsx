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
    grade: "12年级",
    applying: "Yale, Columbia, Dartmouth",
    outcome: "录取 — 达特茅斯",
    color: "bg-[#2C4A3E]",
    teaser:
      "他的第一篇文章面面俱到：领导力、服务精神、坚韧不拔。读到第二段，你就能预测出每一句话的走向。这就是问题所在。",
  },
  {
    slug: "sarah",
    initial: "S",
    name: "Sarah",
    grade: "12年级",
    applying: "Stanford, Yale, Northwestern, Columbia",
    outcome: "录取 — 普林斯顿",
    color: "bg-[#2A3F5A]",
    teaser:
      "她的文章写得很漂亮——干净、克制，情感却很疏远。读完600个字，你对她的了解并不比第一行多。",
  },
  {
    slug: "mia",
    initial: "M",
    name: "Mia",
    grade: "12年级",
    applying: "Emory, Georgetown, UVA, Boston University",
    outcome: "录取 — 西北大学",
    color: "bg-[#3A4A2A]",
    teaser:
      "她的辅导员告诉她不要写电影创作。于是她写了其他一切——但没有一件事真正能呈现出她是谁。",
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
        招生官{" "}
        <strong className="font-semibold text-zinc-900">本质上是人文主义者</strong>，
        他们在申请材料中看重人文思维与情感深度。
      </>
    ),
    difference: (
      <>
        我们训练学生——包括理工科背景的学生——在申请材料中融入{" "}
        <strong className="font-semibold text-emerald-800">人文思维与深度反思</strong>。
      </>
    ),
  },
  {
    number: "02",
    belief: (
      <>
        成就让你进入候选名单。敢于展现{" "}
        <strong className="font-semibold text-zinc-900">情感与脆弱</strong>{" "}
        的文章，才能让你被录取。
      </>
    ),
    difference: (
      <>
        我们推动学生超越表层的"我学到了X"式写作，创作出令招生官难以忘怀的{" "}
        <strong className="font-semibold text-emerald-800">真正袒露内心的叙述</strong>。
      </>
    ),
  },
  {
    number: "03",
    belief: (
      <>
        写作是一个不透明且困难的过程，往往需要{" "}
        <strong className="font-semibold text-zinc-900">数月乃至数年</strong>{" "}
        才能见到成效。AI工具只会让你{" "}
        <strong className="font-semibold text-zinc-900">更难脱颖而出</strong>。
      </>
    ),
    difference: (
      <>
        我们教导学生{" "}
        <strong className="font-semibold text-emerald-800">写作本身的过程</strong>，
        这将在申请结束很久之后继续为他们的成功奠定基础。
      </>
    ),
  },
  {
    number: "04",
    belief: (
      <>
        到了12年级，申请的许多部分已经无法改变。{" "}
        <strong className="font-semibold text-zinc-900">尽早开始</strong>{" "}
        构建{" "}
        <strong className="font-semibold text-zinc-900">独特叙事</strong>，是必须的。
      </>
    ),
    difference: (
      <>
        在12年级之前很久，我们就引导学生远离{" "}
        <strong className="font-semibold text-emerald-800">陈腐叙事</strong>，
        并帮助他们{" "}
        <strong className="font-semibold text-emerald-800">与老师建立深厚的关系</strong>。
      </>
    ),
  },
];

const testimonials = [
  {
    quote:
      "他不只是对我的想法泛泛而谈；他深入到每一个句子，推动我打磨思维，尽可能清晰而真实地呈现自己。",
    attribution: "就读于芝加哥大学的学生",
    type: "student",
  },
  {
    quote:
      "你的活动列表已经能说明问题——文章应该揭示你真正是谁。Sam帮我搞清楚了是什么让我的故事真正属于我自己。",
    attribution: "就读于西北大学的学生",
    type: "student",
  },
  {
    quote:
      "我最想强调的是Sam真诚的关怀。他保持着持续的沟通，给出深思熟虑的反馈，让整个过程不再像是煎熬，而是一件值得骄傲的事。我妈妈也注意到了——他温暖鼓励的消息在整个过程中对她意义重大。某种程度上，申请季对她的压力比对我还大，而Sam确保她同样感受到了支持。",
    attribution: "就读于范德堡大学的学生",
    type: "student",
  },
  {
    quote:
      "Sam是一位真正倾听学生困境并能精准引导他们找到所需的老师。我确信，任何与他合作的家庭都会发现，孩子在大学申请过程中保持着健康、踏实甚至愉快的心态。",
    attribution: "圣路易斯华盛顿大学学生的家长",
    type: "parent",
  },
];

const tutors: Tutor[] = [
  {
    id: "sam",
    name: "Sam Ahn",
    title: "创始人兼首席导师",
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
    title: "高级写作导师",
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
    title: "申请策略师",
    headshotSrc: "/tutor%20photos/maren/maren_headshot.jpeg",
    actionSrc: "/tutor%20photos/maren/maren_headshot.jpeg",
    shortBio:
      "Harvard '26, Cambridge '27. Acceptances: Harvard, Yale. President of the Harvard Advocate. Bowdoin Prize recipient and John Harvard Scholar.",
    longBio:
      "Harvard '26, Cambridge '27. Acceptances: Harvard, Yale. President of the Harvard Advocate. Bowdoin Prize recipient and John Harvard Scholar.",
  },
];

const sections = [
  { id: "hero", label: "首页" },
  { id: "founder", label: "创始人故事" },
  { id: "thesis", label: "我们的使命" },
  { id: "philosophy", label: "理念" },
  { id: "why", label: "为什么重要" },
  { id: "cases", label: "学生故事" },
  { id: "paths", label: "项目" },
  { id: "tutors", label: "我们的团队" },
  { id: "acceptances", label: "录取学校" },
  { id: "testimonials", label: "成果" },
  { id: "cta", label: "开始" },
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
            我们的方法
          </p>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
            我们的理念
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
            StoryLab 的不同之处
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
                我们的方法
              </p>

              {/* Step title (crossfades) */}
              <div className="mt-4" style={{ display: "grid" }}>
                <h2
                  style={{ gridArea: "1 / 1" }}
                  className={`text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl transition-opacity duration-[250ms] ${
                    step === 0 ? "opacity-100" : "opacity-0"
                  }`}
                >
                  我们的理念
                </h2>
                <h2
                  style={{ gridArea: "1 / 1" }}
                  className={`text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl transition-opacity duration-[250ms] ${
                    step === 1 ? "opacity-100" : "opacity-0"
                  }`}
                >
                  StoryLab 的不同之处
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
            为什么重要
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
            备战大学，就是为真实世界做准备。
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-500">
            许多中国家庭将全部精力投入到成绩、奖项和考试分数上——这套逻辑在国内行得通，却在美国申请中失效。真正决定结果的，是更难量化的东西：你是谁，你如何思考，你的故事是否真实动人。
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
                我确实认为，人文学科的学习将比以往任何时候都更加重要。
              </strong>{" "}
              这些[AI]模型在理工科方面表现得非常出色。但我认为，那些让我们独特为人的东西——理解自我、理解历史、理解是什么驱动着我们——我认为这些将永远非常、非常重要。
            </blockquote>
            <div className="mt-5 flex items-center gap-3">
              <div className="h-px w-8 bg-zinc-300" />
              <p className="text-xs text-zinc-400">
                Daniela Amodei，Anthropic总裁（Anthropic为全球领先的人工智能研究公司，Claude AI的开发者）
              </p>
            </div>
          </div>

          {/* Dimon */}
          <div>
            <div className="mb-5 relative h-56 w-full overflow-hidden rounded-xl">
              <Image src="/jamie%20dimon.png" alt="Jamie Dimon" fill className="object-cover" />
            </div>
            <blockquote className="text-xl italic leading-relaxed text-zinc-700">
              我对人们的建议是：批判性思维，学习技能，培养情商，学会在会议中表现出色，{" "}
              <strong className="not-italic font-semibold text-zinc-900">
                学会沟通，学会写作。这样你就不愁找不到工作。
              </strong>
            </blockquote>
            <div className="mt-5 flex items-center gap-3">
              <div className="h-px w-8 bg-zinc-300" />
              <p className="text-xs text-zinc-400">Jamie Dimon，摩根大通首席执行官</p>
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
              为什么重要
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              备战大学，就是为真实世界做准备。
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-500">
              许多中国家庭将全部精力投入到成绩、奖项和考试分数上——这套逻辑在国内行得通，却在美国申请中失效。真正决定结果的，是更难量化的东西：你是谁，你如何思考，你的故事是否真实动人。
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
                      我确实认为，人文学科的学习将比以往任何时候都更加重要。
                    </strong>{" "}
                    这些[AI]模型在理工科方面表现得非常出色。但我认为，那些让我们独特为人的东西——理解自我、理解历史、理解是什么驱动着我们——我认为这些将永远非常、非常重要。
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-px w-10 bg-zinc-300" />
                    <p className="text-xs text-zinc-400">
                      Daniela Amodei，Anthropic总裁（Anthropic为全球领先的人工智能研究公司，Claude AI的开发者）
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
                    我对人们的建议是：批判性思维，学习技能，培养情商，学会在会议中表现出色，{" "}
                    <strong className="not-italic font-semibold text-zinc-900">
                      学会沟通，学会写作。这样你就不愁找不到工作。
                    </strong>
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-px w-10 bg-zinc-300" />
                    <p className="text-xs text-zinc-400">Jamie Dimon，摩根大通首席执行官</p>
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
      aria-label="页面导航"
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
          aria-label={`前往 ${s.label}`}
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

export default function AcademyPageZh() {
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

        <LanguageSwitcher currentLang="zh" />

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
                  招生官本质上是人文主义者。我们训练学生为他们而写作。
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-zinc-600">
                  我们的学生已被哈佛、耶鲁、普林斯顿、斯坦福及其他顶尖大学录取。
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/results"
                    className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
                  >
                    查看成果
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    预约咨询
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
                  创始人故事
                </p>
                <h2 className="mt-5 text-3xl font-semibold leading-[1.2] tracking-tight text-zinc-950 sm:text-4xl">
                  你好，我是Sam。
                </h2>
                <div className="mt-6 space-y-4 text-base leading-relaxed text-zinc-600">
                  <p>
                    到了申请季，我没有赢得任何全国性奖项，也没有创办过一个产生巨大社会影响的组织。我没有发起什么运动，也在网络媒体和新闻报道中毫无踪迹。
                  </p>
                  <p>
                    按照那些志向顶尖学校的优秀学生的标准，我并不是一个"令人印象深刻"的学生。我所做的，不过是取得好成绩、参与学校活动。
                  </p>
                  <p>
                    然而，到了高四那年三月，我收到了哈佛、耶鲁、斯坦福和普林斯顿的录取通知——那是我申请的全部学校。
                  </p>
                  <p>
                    我创立StoryLab，就是为了将让我获录取的那套理念传授给学生。
                  </p>
                  <p>
                    在耶鲁，我以最优等成绩荣誉毕业，加入Phi Beta Kappa学术荣誉学会，获得比较文学学士学位。在大学期间，我曾与前白宫演讲稿撰写人共同为全球最大的一些公司撰稿，并为耶鲁招生办公室评估高中毕业生的申请。
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
                在竞争比以往任何时候都更激烈的申请战场上，我们赋予学生讲述一个出色故事的能力。
              </p>
            </div>
            {/* Right: supporting copy */}
            <div className="flex items-center justify-center bg-white/60 px-8 py-6 md:px-16">
              <p className="text-center text-xl leading-relaxed text-zinc-600 sm:text-2xl">
                许多家庭犯了一个错误——将所有精力投入到申请的"硬"指标上，如考试成绩和奖项，而真正让学生被录取的，往往是那些"软"的部分。
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
                学生故事
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                认识我们的部分学生。
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-500">
                每一个来到StoryLab的学生都有真实的故事要讲。他们只是还没有找到而已。
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
              三条路径。一个根基。
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  href: "/academy/humanities",
                  title: "人文基础",
                  desc: "7–11年级。在你需要之前打好基础。",
                },
                {
                  href: "/academy/applications",
                  title: "大学申请",
                  desc: "11–12年级。以一个已经成型的声音定位并申请。",
                },
                {
                  href: "/academy/transfer",
                  title: "转学申请",
                  desc: "大学生。第二次讲好故事的机会。",
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
                    了解更多 →
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
            headline="不仅是藤校毕业生，更是藤校招生内部人士。"
            body="在哈佛和耶鲁受过培训的获奖出版作家，持有多所顶尖学校的录取通知书，并有藤校招生办公室的工作经验。"
            ctaHref="/team"
            ctaLabel="了解完整团队"
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
              我们学生的录取院校
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
                家庭的心声
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                用他们自己的话说。
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
                阅读完整评价
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
                每个申请季我们只接受有限数量的学生。
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-zinc-600">
                写作需要时间积累。越早开始，选择越多。预约咨询，讨论适合度与时机。
              </p>
              <div className="mt-10">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-8 py-4 text-base font-medium text-white hover:bg-zinc-800"
                >
                  预约咨询
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}

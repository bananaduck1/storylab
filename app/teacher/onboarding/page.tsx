"use client";

import React, { useState } from "react";
import Link from "next/link";

const STEPS = [
  { number: 1, label: "PROFILE" },
  { number: 2, label: "AGENT CONFIG" },
  { number: 3, label: "PRICING" },
  { number: 4, label: "PREVIEW" },
  { number: 5, label: "PUBLISH" },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-10">
      {/* Mobile: text only */}
      <p
        className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 sm:hidden"
      >
        Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].label}
      </p>

      {/* Desktop: eyebrow + dots */}
      <div className="hidden sm:block">
        <p
          className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-4"
        >
          Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].label}
        </p>
        <div className="flex gap-3">
          {STEPS.map((step) => {
            const isComplete = step.number < currentStep;
            const isCurrent = step.number === currentStep;
            return (
              <div
                key={step.number}
                className={`h-2 w-2 rounded-full transition-all duration-200 ${
                  isComplete
                    ? "bg-[#2C4A3E]"
                    : isCurrent
                    ? "border-2 border-[#2C4A3E] bg-transparent"
                    : "bg-[#C0D9CB]"
                }`}
                aria-label={
                  isComplete
                    ? `Step ${step.number} complete`
                    : isCurrent
                    ? `Step ${step.number} current`
                    : `Step ${step.number} upcoming`
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Profile ──────────────────────────────────────────────────────────

function Step1Profile({ onNext }: { onNext: (data: ProfileData) => void }) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [bio, setBio] = useState("");
  const [quote, setQuote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ name, subject, bio, quote });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1
        className="text-[2rem] leading-[1.2] tracking-tight text-[#1A2E26]"
        style={{ fontFamily: "var(--font-cooper, serif)" }}
      >
        Tell us about yourself.
      </h1>
      <p
        className="text-base leading-relaxed text-[#1A2E26]/60"
        style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
      >
        This is what students will see on your public profile.
      </p>

      <div>
        <label
          htmlFor="name"
          className="block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-2"
        >
          Full name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Sam Ahn"
          className="w-full rounded-[4px] border border-[#C0D9CB] bg-white px-4 py-3 text-base text-[#1A2E26] placeholder-[#1A2E26]/30 focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/30"
          style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
        />
      </div>

      <div>
        <label
          htmlFor="subject"
          className="block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-2"
        >
          Subject / specialty
        </label>
        <input
          id="subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          placeholder="College Essay Coach"
          className="w-full rounded-[4px] border border-[#C0D9CB] bg-white px-4 py-3 text-base text-[#1A2E26] placeholder-[#1A2E26]/30 focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/30"
          style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
        />
      </div>

      <div>
        <label
          htmlFor="bio"
          className="block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-2"
        >
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          required
          rows={5}
          placeholder="Tell students about your background, experience, and what makes your coaching approach distinctive."
          className="w-full resize-none rounded-[4px] border border-[#C0D9CB] bg-white px-4 py-3 text-base text-[#1A2E26] placeholder-[#1A2E26]/30 focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/30"
          style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
        />
      </div>

      <div>
        <label
          htmlFor="quote"
          className="block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-2"
        >
          Your coaching philosophy (one sentence)
        </label>
        <input
          id="quote"
          type="text"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="Your story is already there. We find it together."
          className="w-full rounded-[4px] border border-[#C0D9CB] bg-white px-4 py-3 text-base text-[#1A2E26] placeholder-[#1A2E26]/30 focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/30"
          style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
        />
        <p
          className="mt-1.5 text-xs text-[#1A2E26]/40"
        >
          This appears on your teacher card. Optional but recommended.
        </p>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="inline-flex items-center rounded-[3px] bg-[#2C4A3E] px-6 py-3 text-sm font-medium text-white hover:bg-[#3A6054] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40"
        >
          Save &amp; Continue →
        </button>
      </div>
    </form>
  );
}

// ─── Step 2: Agent Config ──────────────────────────────────────────────────────

function Step2AgentConfig({
  onNext,
  onBack,
}: {
  onNext: (data: AgentConfigData) => void;
  onBack: () => void;
}) {
  const [teachingStyle, setTeachingStyle] = useState("");
  const [corePrinciples, setCorePrinciples] = useState("");
  const [avoidances, setAvoidances] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ teachingStyle, corePrinciples, avoidances });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1
        className="text-[2rem] leading-[1.2] tracking-tight text-[#1A2E26]"
        style={{ fontFamily: "var(--font-cooper, serif)" }}
      >
        Configure your AI agent.
      </h1>
      <p
        className="text-base leading-relaxed text-[#1A2E26]/60"
        style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
      >
        Your AI agent is trained on your coaching philosophy. The more you share here, the more it sounds like you.
      </p>

      <div>
        <label
          htmlFor="teaching-style"
          className="block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-2"
        >
          Your teaching style
        </label>
        <textarea
          id="teaching-style"
          value={teachingStyle}
          onChange={(e) => setTeachingStyle(e.target.value)}
          required
          rows={4}
          placeholder="Describe how you approach coaching sessions. Do you ask lots of questions? Focus on structure first? Use Socratic dialogue?"
          className="w-full resize-none rounded-[4px] border border-[#C0D9CB] bg-white px-4 py-3 text-base text-[#1A2E26] placeholder-[#1A2E26]/30 focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/30"
          style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
        />
      </div>

      <div>
        <label
          htmlFor="core-principles"
          className="block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-2"
        >
          Your core writing beliefs
        </label>
        <textarea
          id="core-principles"
          value={corePrinciples}
          onChange={(e) => setCorePrinciples(e.target.value)}
          required
          rows={4}
          placeholder="What do you believe about great writing? What principles guide your feedback? e.g., 'Specificity beats generality every time.'"
          className="w-full resize-none rounded-[4px] border border-[#C0D9CB] bg-white px-4 py-3 text-base text-[#1A2E26] placeholder-[#1A2E26]/30 focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/30"
          style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
        />
      </div>

      <div>
        <label
          htmlFor="avoidances"
          className="block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-2"
        >
          What your agent should never do
        </label>
        <textarea
          id="avoidances"
          value={avoidances}
          onChange={(e) => setAvoidances(e.target.value)}
          rows={3}
          placeholder="e.g., 'Never write the essay for the student. Never give feedback without asking at least one clarifying question.'"
          className="w-full resize-none rounded-[4px] border border-[#C0D9CB] bg-white px-4 py-3 text-base text-[#1A2E26] placeholder-[#1A2E26]/30 focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/30"
          style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
        />
      </div>

      <div className="flex gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center rounded-[3px] border border-[#C0D9CB] bg-transparent px-5 py-3 text-sm font-medium text-[#1A2E26] hover:bg-[#DEEEE9] transition-colors"
        >
          ← Back
        </button>
        <button
          type="submit"
          className="inline-flex items-center rounded-[3px] bg-[#2C4A3E] px-6 py-3 text-sm font-medium text-white hover:bg-[#3A6054] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40"
        >
          Save &amp; Continue →
        </button>
      </div>
    </form>
  );
}

// ─── Step 3: Pricing ──────────────────────────────────────────────────────────

function Step3Pricing({
  onNext,
  onBack,
}: {
  onNext: (data: PricingData) => void;
  onBack: () => void;
}) {
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [sessionPrice, setSessionPrice] = useState("");
  const [googleCalendarId, setGoogleCalendarId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ monthlyPrice, sessionPrice, googleCalendarId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1
        className="text-[2rem] leading-[1.2] tracking-tight text-[#1A2E26]"
        style={{ fontFamily: "var(--font-cooper, serif)" }}
      >
        Set your pricing.
      </h1>
      <p
        className="text-base leading-relaxed text-[#1A2E26]/60"
        style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
      >
        You can update this at any time. Payment processing coming soon — for now, this captures your intended pricing.
      </p>

      <div>
        <label
          htmlFor="monthly-price"
          className="block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-2"
        >
          Monthly subscription price (USD)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A2E26]/40 pointer-events-none">$</span>
          <input
            id="monthly-price"
            type="number"
            min="0"
            step="1"
            value={monthlyPrice}
            onChange={(e) => setMonthlyPrice(e.target.value)}
            placeholder="49"
            className="w-full rounded-[4px] border border-[#C0D9CB] bg-white pl-8 pr-4 py-3 text-base text-[#1A2E26] placeholder-[#1A2E26]/30 focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/30"
            style={{ fontFamily: "var(--font-body, 'Literata', serif)", fontVariantNumeric: "tabular-nums" }}
          />
        </div>
        <p
          className="mt-1.5 text-xs text-[#1A2E26]/40"
        >
          AI coaching access for students. Unlimited messages.
        </p>
      </div>

      <div>
        <label
          htmlFor="session-price"
          className="block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-2"
        >
          Live session price (USD)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A2E26]/40 pointer-events-none">$</span>
          <input
            id="session-price"
            type="number"
            min="0"
            step="1"
            value={sessionPrice}
            onChange={(e) => setSessionPrice(e.target.value)}
            placeholder="150"
            className="w-full rounded-[4px] border border-[#C0D9CB] bg-white pl-8 pr-4 py-3 text-base text-[#1A2E26] placeholder-[#1A2E26]/30 focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/30"
            style={{ fontFamily: "var(--font-body, 'Literata', serif)", fontVariantNumeric: "tabular-nums" }}
          />
        </div>
        <p
          className="mt-1.5 text-xs text-[#1A2E26]/40"
        >
          Per 1-hour live video coaching session.
        </p>
      </div>

      <div>
        <label
          htmlFor="google-calendar-id"
          className="block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-2"
        >
          Google Calendar ID (optional)
        </label>
        <input
          id="google-calendar-id"
          type="text"
          value={googleCalendarId}
          onChange={(e) => setGoogleCalendarId(e.target.value)}
          placeholder="your-calendar@group.calendar.google.com"
          className="w-full rounded-[4px] border border-[#C0D9CB] bg-white px-4 py-3 text-base text-[#1A2E26] placeholder-[#1A2E26]/30 focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/30"
          style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
        />
        <p
          className="mt-1.5 text-xs text-[#1A2E26]/40"
        >
          Connect your Google Calendar to automatically sync your available booking slots.
          Find this in Google Calendar → Settings → your calendar → Calendar ID.
        </p>
      </div>

      <div className="flex gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center rounded-[3px] border border-[#C0D9CB] bg-transparent px-5 py-3 text-sm font-medium text-[#1A2E26] hover:bg-[#DEEEE9] transition-colors"
        >
          ← Back
        </button>
        <button
          type="submit"
          className="inline-flex items-center rounded-[3px] bg-[#2C4A3E] px-6 py-3 text-sm font-medium text-white hover:bg-[#3A6054] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40"
        >
          Save &amp; Continue →
        </button>
      </div>
    </form>
  );
}

// ─── Step 4: Preview ──────────────────────────────────────────────────────────

function Step4Preview({
  teacherSlug,
  onNext,
  onBack,
}: {
  teacherSlug: string | null;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <h1
        className="text-[2rem] leading-[1.2] tracking-tight text-[#1A2E26]"
        style={{ fontFamily: "var(--font-cooper, serif)" }}
      >
        Preview your storefront.
      </h1>
      <p
        className="text-base leading-relaxed text-[#1A2E26]/60"
        style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
      >
        This is how students will see your page. Review it before publishing.
      </p>

      {teacherSlug ? (
        <div className="rounded-[4px] border border-[#C0D9CB] overflow-hidden" style={{ height: "60vh" }}>
          {/* Browser chrome mockup */}
          <div className="flex items-center gap-2 px-4 py-3 bg-zinc-100 border-b border-zinc-200">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-zinc-300" />
              <div className="h-3 w-3 rounded-full bg-zinc-300" />
              <div className="h-3 w-3 rounded-full bg-zinc-300" />
            </div>
            <div
              className="flex-1 mx-4 px-3 py-1 text-xs text-zinc-500 bg-white rounded border border-zinc-200 truncate"
            >
              /teachers/{teacherSlug}
            </div>
          </div>
          <iframe
            src={`/teachers/${teacherSlug}?preview=true`}
            className="w-full"
            style={{ height: "calc(60vh - 48px)", border: "none" }}
            title="Storefront preview"
          />
        </div>
      ) : (
        <div className="rounded-[4px] border border-[#C0D9CB] bg-[#DEEEE9] p-10 text-center">
          <p
            className="text-base text-[#1A2E26]/60"
            style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
          >
            Your storefront preview will appear here once your profile is saved.
          </p>
        </div>
      )}

      <div className="flex gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center rounded-[3px] border border-[#C0D9CB] bg-transparent px-5 py-3 text-sm font-medium text-[#1A2E26] hover:bg-[#DEEEE9] transition-colors"
        >
          ← Edit
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center rounded-[3px] bg-[#2C4A3E] px-6 py-3 text-sm font-medium text-white hover:bg-[#3A6054] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40"
        >
          Looks good — Publish →
        </button>
      </div>
    </div>
  );
}

// ─── Step 5: Publish ──────────────────────────────────────────────────────────

function Step5Publish({ teacherSlug }: { teacherSlug: string | null }) {
  return (
    <div className="space-y-6 text-center py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#DEEEE9] mb-2">
        <svg className="h-8 w-8 text-[#2C4A3E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1
        className="text-[2rem] leading-[1.2] tracking-tight text-[#1A2E26]"
        style={{ fontFamily: "var(--font-cooper, serif)" }}
      >
        You&rsquo;re live!
      </h1>
      <p
        className="text-base leading-relaxed text-[#1A2E26]/60 max-w-sm mx-auto"
        style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
      >
        Your profile has been submitted. Once reviewed, your storefront will be published and visible to students.
      </p>
      {teacherSlug && (
        <div className="pt-4">
          <Link
            href={`/teachers/${teacherSlug}`}
            className="inline-flex items-center rounded-[3px] bg-[#2C4A3E] px-6 py-3 text-sm font-medium text-white hover:bg-[#3A6054] transition-colors duration-150"
          >
            View your storefront →
          </Link>
        </div>
      )}
      <div className="pt-2">
        <Link
          href="/"
          className="text-sm text-[#1A2E26]/50 hover:text-[#2C4A3E] transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  name: string;
  subject: string;
  bio: string;
  quote: string;
}

interface AgentConfigData {
  teachingStyle: string;
  corePrinciples: string;
  avoidances: string;
}

interface PricingData {
  monthlyPrice: string;
  sessionPrice: string;
  googleCalendarId: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeacherOnboardingPage() {
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [agentConfigData, setAgentConfigData] = useState<AgentConfigData | null>(null);
  const [pricingData, setPricingData] = useState<PricingData | null>(null);

  // Derive slug from name (simplified: lowercase, replace spaces with hyphens, take first char of last name)
  const teacherSlug = profileData
    ? (() => {
        const parts = profileData.name.trim().toLowerCase().split(/\s+/);
        if (parts.length >= 2) {
          return `${parts[0]}-${parts[parts.length - 1][0]}`;
        }
        return parts[0] ?? null;
      })()
    : null;

  const handleProfileNext = (data: ProfileData) => {
    setProfileData(data);
    setStep(2);
  };

  const handleAgentConfigNext = async (data: AgentConfigData) => {
    setAgentConfigData(data);
    setStep(3);
  };

  const handlePricingNext = async (data: PricingData) => {
    setPricingData(data);
    // In a full implementation, this would POST to /api/teacher/onboarding
    // For now, advance to preview
    setStep(4);
  };

  const handlePublish = async () => {
    // In a full implementation, this would mark the teacher as storefront_published
    // For now, just advance to success state
    setStep(5);
  };

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <div className="border-b border-[#C0D9CB] bg-[#FAFAF8] px-6 py-4">
        <div className="mx-auto max-w-xl">
          <Link
            href="/"
            className="text-sm text-[#1A2E26]/50 hover:text-[#2C4A3E] transition-colors"
          >
            ← StoryLab
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-6 py-12 md:py-16">
        <StepIndicator currentStep={step} />

        {step === 1 && <Step1Profile onNext={handleProfileNext} />}
        {step === 2 && (
          <Step2AgentConfig
            onNext={handleAgentConfigNext}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3Pricing
            onNext={handlePricingNext}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <Step4Preview
            teacherSlug={teacherSlug}
            onNext={handlePublish}
            onBack={() => setStep(3)}
          />
        )}
        {step === 5 && <Step5Publish teacherSlug={teacherSlug} />}
      </div>
    </main>
  );
}

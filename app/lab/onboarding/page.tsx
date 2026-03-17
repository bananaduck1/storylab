"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VALID_GRADES as GRADES } from "@/lib/lab-constants";

const STEPS = [
  { title: "What should Sam call you?", subtitle: "Let's get acquainted before we dive into your essays." },
  { title: "What schools are you considering?", subtitle: "No pressure — you can always update this later." },
  { title: "Tell Sam about your essays", subtitle: "This helps Sam understand where you are in the process." },
  { title: "What do you most want to get out of this?", subtitle: "The more Sam knows, the better the coaching." },
];

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState("");
  const [schools, setSchools] = useState("");
  const [essayFocus, setEssayFocus] = useState("");
  const [writingVoice, setWritingVoice] = useState("");
  const [goals, setGoals] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function canAdvance(): boolean {
    if (step === 0) return fullName.trim().length > 0 && grade.length > 0;
    return true;
  }

  function next() {
    if (!canAdvance()) return;
    setStep((s) => s + 1);
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function submit() {
    if (!canAdvance()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/lab/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          grade,
          schools: schools || null,
          essay_focus: essayFocus || null,
          writing_voice: writingVoice || null,
          goals: goals || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      router.replace("/lab");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-4 py-12">
      {/* Brand */}
      <div className="mb-8 text-center">
        <p className="text-xs font-medium tracking-widest text-zinc-400 uppercase mb-1">IvyStoryLab</p>
        <h1 className="text-2xl font-semibold text-zinc-900">Meet Sam, your essay coach</h1>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-200 ${
              i === step
                ? "w-6 h-2 bg-zinc-900"
                : i < step
                ? "w-2 h-2 bg-zinc-400"
                : "w-2 h-2 bg-zinc-200"
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 mb-1">{STEPS[step].title}</h2>
          <p className="text-sm text-zinc-500">{STEPS[step].subtitle}</p>
        </div>

        {/* Step 0: Name + Grade */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">
                First name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                autoFocus
                className="w-full border-0 border-b-2 border-zinc-200 focus:border-zinc-900 outline-none text-zinc-900 text-base py-2 bg-transparent transition-colors placeholder:text-zinc-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">
                Grade
              </label>
              <div className="flex flex-wrap gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      grade === g
                        ? "bg-zinc-900 text-white border-zinc-900"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Schools */}
        {step === 1 && (
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">
              Target schools (optional)
            </label>
            <textarea
              value={schools}
              onChange={(e) => setSchools(e.target.value)}
              placeholder="Harvard, Stanford, Yale... or I'm still figuring it out"
              autoFocus
              rows={4}
              className="w-full border border-zinc-200 focus:border-zinc-900 outline-none text-zinc-900 text-sm py-3 px-4 rounded-xl bg-transparent transition-colors placeholder:text-zinc-300 resize-none"
            />
          </div>
        )}

        {/* Step 2: Essay focus + Voice */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">
                Topics or themes you&apos;re exploring (optional)
              </label>
              <textarea
                value={essayFocus}
                onChange={(e) => setEssayFocus(e.target.value)}
                placeholder="Identity, family, a sport, a project I built, something I'm still figuring out..."
                autoFocus
                rows={3}
                className="w-full border border-zinc-200 focus:border-zinc-900 outline-none text-zinc-900 text-sm py-3 px-4 rounded-xl bg-transparent transition-colors placeholder:text-zinc-300 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">
                Your writing voice (optional)
              </label>
              <textarea
                value={writingVoice}
                onChange={(e) => setWritingVoice(e.target.value)}
                placeholder="Analytical, conversational, lyrical..."
                rows={2}
                className="w-full border border-zinc-200 focus:border-zinc-900 outline-none text-zinc-900 text-sm py-3 px-4 rounded-xl bg-transparent transition-colors placeholder:text-zinc-300 resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Goals */}
        {step === 3 && (
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">
              Your goals (optional)
            </label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="Get into my top school, find my story, improve my writing, figure out what to write about..."
                autoFocus
                rows={4}
                className="w-full border border-zinc-200 focus:border-zinc-900 outline-none text-zinc-900 text-sm py-3 px-4 rounded-xl bg-transparent transition-colors placeholder:text-zinc-300 resize-none"
              />
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-0 disabled:pointer-events-none"
          >
            ← Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canAdvance()}
              className="px-6 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="px-6 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Setting up…
                </>
              ) : (
                "Let's get started →"
              )}
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-zinc-300 text-center">
        You can always update these details later
      </p>
    </div>
  );
}

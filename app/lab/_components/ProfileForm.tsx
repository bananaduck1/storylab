"use client";

import { useState } from "react";
import { VALID_GRADES as GRADES } from "@/lib/lab-constants";

interface ProfileData {
  full_name: string;
  grade: string;
  schools: string | null;
  essay_focus: string | null;
  writing_voice: string | null;
  goals: string | null;
  portrait_notes: string | null;
  updated_at: string;
}

interface Stats {
  convCount: number;
  msgCount: number;
  email: string;
}

export default function ProfileForm({
  profile: initial,
  stats,
}: {
  profile: ProfileData;
  stats: Stats;
}) {
  const [fullName, setFullName] = useState(initial.full_name ?? "");
  const [grade, setGrade] = useState(initial.grade ?? "");
  const [schools, setSchools] = useState(initial.schools ?? "");
  const [essayFocus, setEssayFocus] = useState(initial.essay_focus ?? "");
  const [writingVoice, setWritingVoice] = useState(initial.writing_voice ?? "");
  const [goals, setGoals] = useState(initial.goals ?? "");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [portrait, setPortrait] = useState<string | null>(initial.portrait_notes);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  // Profile completeness: count non-empty optional fields
  const optionalFields = [schools, essayFocus, writingVoice, goals];
  const filledCount = optionalFields.filter((f) => f.trim().length > 0).length;
  const totalOptional = optionalFields.length;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError("");
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
        setSaveError(data.error || "Something went wrong.");
      } else {
        setSaved(true);
      }
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPortrait() {
    if (!window.confirm("Clear Sam's coaching memory about you? This can't be undone.")) return;
    setResetting(true);
    setResetError("");
    try {
      const res = await fetch("/api/lab/portrait/reset", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setResetError(data.error || "Failed to reset.");
      } else {
        setPortrait(null);
      }
    } catch {
      setResetError("Network error. Please try again.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-white text-zinc-900">
      {/* Top bar */}
      <div className="flex h-10 items-center border-b border-zinc-200 px-4">
        <a href="/lab" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
          ← Lab
        </a>
      </div>

      <div className="mx-auto max-w-lg px-6 py-10 space-y-10">
        <h1 className="text-sm font-semibold text-zinc-900">Your coaching profile</h1>

        {/* Profile completeness */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: totalOptional }).map((_, i) => (
              <div
                key={i}
                className={`h-1 w-6 rounded-full ${i < filledCount ? "bg-zinc-900" : "bg-zinc-200"}`}
              />
            ))}
          </div>
          <p className="text-xs text-zinc-400">
            {filledCount === totalOptional
              ? "Profile complete — Sam has full context"
              : `${filledCount} of ${totalOptional} optional fields filled`}
          </p>
        </div>

        {/* Coaching form */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">
              Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setSaved(false); }}
              placeholder="Your name"
              required
              className="w-full border-0 border-b-2 border-zinc-200 focus:border-zinc-900 outline-none text-zinc-900 text-sm py-2 bg-transparent transition-colors placeholder:text-zinc-300"
            />
          </div>

          {/* Grade */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">
              Grade
            </label>
            <div className="flex flex-wrap gap-2">
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => { setGrade(g); setSaved(false); }}
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

          {/* Schools */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">
              Target schools <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={schools}
              onChange={(e) => { setSchools(e.target.value); setSaved(false); }}
              placeholder="Harvard, Stanford, Yale... or I'm still figuring it out"
              rows={3}
              className="w-full border border-zinc-200 focus:border-zinc-900 outline-none text-zinc-900 text-sm py-3 px-4 rounded-xl bg-transparent transition-colors placeholder:text-zinc-300 resize-none"
            />
          </div>

          {/* Essay focus */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">
              Topics or themes you&apos;re exploring <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={essayFocus}
              onChange={(e) => { setEssayFocus(e.target.value); setSaved(false); }}
              placeholder="Identity, family, a sport, a project I built..."
              rows={3}
              className="w-full border border-zinc-200 focus:border-zinc-900 outline-none text-zinc-900 text-sm py-3 px-4 rounded-xl bg-transparent transition-colors placeholder:text-zinc-300 resize-none"
            />
          </div>

          {/* Writing voice */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">
              Your writing voice <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={writingVoice}
              onChange={(e) => { setWritingVoice(e.target.value); setSaved(false); }}
              placeholder="Analytical, conversational, lyrical..."
              rows={2}
              className="w-full border border-zinc-200 focus:border-zinc-900 outline-none text-zinc-900 text-sm py-3 px-4 rounded-xl bg-transparent transition-colors placeholder:text-zinc-300 resize-none"
            />
          </div>

          {/* Goals */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wide">
              Your goals <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={goals}
              onChange={(e) => { setGoals(e.target.value); setSaved(false); }}
              placeholder="Get into my top school, find my story, improve my writing..."
              rows={3}
              className="w-full border border-zinc-200 focus:border-zinc-900 outline-none text-zinc-900 text-sm py-3 px-4 rounded-xl bg-transparent transition-colors placeholder:text-zinc-300 resize-none"
            />
          </div>

          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {saveError}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || !fullName.trim() || !grade}
              className="px-6 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {saved && <p className="text-xs text-zinc-400">Saved.</p>}
          </div>
        </form>

        {/* What Sam remembers */}
        <section className="border-t border-zinc-100 pt-8">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                What Sam remembers
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">AI-generated. Updates after each session.</p>
            </div>
            {portrait && (
              <button
                onClick={handleResetPortrait}
                disabled={resetting}
                className="text-xs text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-40 shrink-0 ml-4"
              >
                {resetting ? "Clearing…" : "Clear memory"}
              </button>
            )}
          </div>
          {portrait ? (
            <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap bg-zinc-50 rounded-xl px-4 py-3 border border-zinc-100">
              {portrait}
            </p>
          ) : (
            <p className="text-sm text-zinc-400 italic">
              No coaching memory yet. Sam will build this as you chat.
            </p>
          )}
          {resetError && (
            <p className="mt-2 text-xs text-red-500">{resetError}</p>
          )}
        </section>

        {/* Your journey */}
        <section className="border-t border-zinc-100 pt-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">
            Your journey
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-semibold text-zinc-900">{stats.convCount}</p>
              <p className="text-xs text-zinc-400 mt-0.5">conversations</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-zinc-900">{stats.msgCount}</p>
              <p className="text-xs text-zinc-400 mt-0.5">messages</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-4">
            Profile last updated{" "}
            {new Date(initial.updated_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </section>

        {/* Account section */}
        <section className="border-t border-zinc-100 pt-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">
            Account
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500">Email</p>
              <p className="text-sm text-zinc-700 mt-0.5">{stats.email}</p>
            </div>
            <a
              href="/lab/settings"
              className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              Account settings →
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

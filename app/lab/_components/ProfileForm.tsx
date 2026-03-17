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
  favorites_book: string | null;
  favorites_movie: string | null;
  favorites_song: string | null;
  strengths_notes: string | null;
  growth_notes: string | null;
  portrait_summary_updated_at: string | null;
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
  const [favBook, setFavBook] = useState(initial.favorites_book ?? "");
  const [favMovie, setFavMovie] = useState(initial.favorites_movie ?? "");
  const [favSong, setFavSong] = useState(initial.favorites_song ?? "");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [portrait, setPortrait] = useState<string | null>(initial.portrait_notes);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  const [strengths, setStrengths] = useState<string | null>(initial.strengths_notes);
  const [growthAreas, setGrowthAreas] = useState<string | null>(initial.growth_notes);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");

  // Profile completeness: count non-empty optional fields
  const optionalFields = [schools, essayFocus, writingVoice, goals, favBook, favMovie, favSong];
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
          favorites_book: favBook || null,
          favorites_movie: favMovie || null,
          favorites_song: favSong || null,
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

  async function handleRefreshPortrait() {
    setRefreshing(true);
    setRefreshError("");
    try {
      const res = await fetch("/api/lab/profile/refresh-portrait", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setRefreshError(data.error || "Failed to refresh.");
      } else {
        const data = await res.json();
        setStrengths(data.strengths_notes);
        setGrowthAreas(data.growth_notes);
      }
    } catch {
      setRefreshError("Network error. Please try again.");
    } finally {
      setRefreshing(false);
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

          {/* Favorites */}
          <div className="space-y-4 pt-2 border-t border-zinc-100">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide pt-2">
              A few favorites <span className="normal-case font-normal">(optional — helps Sam get to know you)</span>
            </p>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Favorite book</label>
              <input
                type="text"
                value={favBook}
                onChange={(e) => { setFavBook(e.target.value); setSaved(false); }}
                placeholder="e.g. The Alchemist, The Brief Wondrous Life of Oscar Wao…"
                className="w-full border-0 border-b border-zinc-200 focus:border-zinc-900 outline-none text-zinc-900 text-sm py-2 bg-transparent transition-colors placeholder:text-zinc-300"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Favorite movie or show</label>
              <input
                type="text"
                value={favMovie}
                onChange={(e) => { setFavMovie(e.target.value); setSaved(false); }}
                placeholder="e.g. Spirited Away, Atlanta…"
                className="w-full border-0 border-b border-zinc-200 focus:border-zinc-900 outline-none text-zinc-900 text-sm py-2 bg-transparent transition-colors placeholder:text-zinc-300"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Favorite song or artist</label>
              <input
                type="text"
                value={favSong}
                onChange={(e) => { setFavSong(e.target.value); setSaved(false); }}
                placeholder={`e.g. Kendrick Lamar, "Saturn" by SZA…`}
                className="w-full border-0 border-b border-zinc-200 focus:border-zinc-900 outline-none text-zinc-900 text-sm py-2 bg-transparent transition-colors placeholder:text-zinc-300"
              />
            </div>
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

        {/* Your portrait */}
        <section className="border-t border-zinc-100 pt-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Your portrait
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">AI-generated from your coaching sessions.</p>
            </div>
            {portrait && (
              <button
                onClick={handleRefreshPortrait}
                disabled={refreshing}
                className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-40 shrink-0 ml-4"
              >
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
            )}
          </div>

          {portrait ? (
            <div className="space-y-5">
              {(strengths || growthAreas) ? (
                <>
                  {strengths && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">Strengths</p>
                      <ul className="space-y-1.5">
                        {strengths.split("\n").filter(Boolean).map((s, i) => (
                          <li key={i} className="text-sm text-zinc-700 leading-relaxed flex gap-2">
                            <span className="text-zinc-300 shrink-0">—</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {growthAreas && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">Growing in</p>
                      <ul className="space-y-1.5">
                        {growthAreas.split("\n").filter(Boolean).map((g, i) => (
                          <li key={i} className="text-sm text-zinc-700 leading-relaxed flex gap-2">
                            <span className="text-zinc-300 shrink-0">—</span>
                            {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(favBook || favMovie || favSong) && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">Interests</p>
                      <div className="space-y-1 text-sm text-zinc-600">
                        {favBook && <p><span className="text-zinc-400">Book:</span> {favBook}</p>}
                        {favMovie && <p><span className="text-zinc-400">Movie:</span> {favMovie}</p>}
                        {favSong && <p><span className="text-zinc-400">Music:</span> {favSong}</p>}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3">
                  <p className="text-sm text-zinc-400 italic">Portrait not yet extracted.</p>
                  <button
                    onClick={handleRefreshPortrait}
                    disabled={refreshing}
                    className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors disabled:opacity-40 shrink-0 ml-3"
                  >
                    {refreshing ? "Working…" : "Generate →"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-400 italic">
              No portrait yet — Sam will build one as you chat.
            </p>
          )}
          {refreshError && <p className="mt-2 text-xs text-red-500">{refreshError}</p>}
        </section>

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

"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { StorefrontContent, CaseStudy, Testimonial, PhilosophyStep } from "@/lib/types/storefront";
import type { CompletenessResult } from "@/lib/teacher-completeness";
import { computeCompleteness } from "@/lib/teacher-completeness";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  agent_config: Record<string, unknown>;
  bio: string | null;
  photo_url: string | null;
  quote: string | null;
  pricing_config: Record<string, unknown> | null;
  ai_coaching_enabled: boolean;
  live_sessions_enabled: boolean;
  primary_emphasis: 'ai' | 'live' | 'equal';
  storefront_content: StorefrontContent | null;
  storefront_published: boolean;
}

type TabId = 'profile' | 'storefront' | 'agent' | 'settings' | 'publish';

const TABS: { id: TabId; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'storefront', label: 'Storefront' },
  { id: 'agent', label: 'AI Agent' },
  { id: 'settings', label: 'Settings' },
  { id: 'publish', label: 'Publish' },
];

const AGENT_QUESTIONS = [
  {
    key: "identity" as const,
    label: "Who are you as a teacher?",
    hint: "What do you teach, who do you teach it to, and what brought you to this work?",
    placeholder: "I'm a college essay coach who works with high school juniors and seniors. I started because I noticed how many students had extraordinary stories they couldn't see as interesting…",
  },
  {
    key: "core_beliefs" as const,
    label: "What do you believe makes the difference?",
    hint: "Between a student who gets it and one who doesn't — what separates them?",
    placeholder: "The students who break through aren't the best writers — they're the ones willing to be specific. Vague means safe. Specific means vulnerable. I teach students to tolerate vulnerability on the page.",
  },
  {
    key: "diagnostic_eye" as const,
    label: "What do you notice that others miss?",
    hint: "When you read a student's draft or hear them talk, what tells you something no one else caught?",
    placeholder: "I listen for the moment they rush past. Students will say 'and then I just sort of figured it out' — that sentence is the essay. They buried the whole thing in a subordinate clause.",
  },
  {
    key: "voice" as const,
    label: "How would a student describe working with you?",
    hint: "Your tone, your style, your energy in a session.",
    placeholder: "Intense but warm. I ask a lot of questions. I don't write for them — I excavate. They usually feel uncomfortable before they feel good. The discomfort is the process.",
  },
  {
    key: "signature_moves" as const,
    label: "What are your 2–3 signature coaching moves?",
    hint: "The things you almost always do. The moves that are distinctly yours.",
    placeholder: "Enter each move on a new line, e.g.:\nThe Five Whys — I keep asking why until we hit something real\nThe Rush Test — I flag every sentence where they seem to skip past something important",
    isMultiline: true,
  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyCaseStudy(): CaseStudy {
  return { student_label: "", outcome: "", teaser: "", challenge: "", what_changed: "" };
}

function emptyTestimonial(): Testimonial {
  return { quote: "", attribution: "" };
}

function emptyPhilosophyStep(): PhilosophyStep {
  return { label: "", body: "", photo_url: null };
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SettingsClient({
  teacher,
  completeness: initialCompleteness,
}: {
  teacher: Teacher;
  completeness: CompletenessResult;
}) {
  const config = teacher.agent_config ?? {};
  const sc = teacher.storefront_content;

  // ── Profile tab state
  const [bio, setBio] = useState(teacher.bio ?? "");
  const [quote, setQuote] = useState(teacher.quote ?? "");
  const [subject, setSubject] = useState(teacher.subject ?? "");
  const [photoUrl, setPhotoUrl] = useState(teacher.photo_url ?? "");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── AI Agent tab state
  const [agentForm, setAgentForm] = useState({
    identity: typeof config.identity === "string" ? config.identity : "",
    core_beliefs: typeof config.core_beliefs === "string" ? config.core_beliefs : "",
    diagnostic_eye: typeof config.diagnostic_eye === "string" ? config.diagnostic_eye : "",
    voice: typeof config.voice === "string" ? config.voice : "",
    signature_moves: Array.isArray(config.signature_moves)
      ? (config.signature_moves as string[]).join("\n")
      : "",
  });

  // ── Storefront tab state
  const [heroHeadline, setHeroHeadline] = useState(sc?.hero?.headline ?? "");
  const [heroSubheadline, setHeroSubheadline] = useState(sc?.hero?.subheadline ?? "");
  const [storyTitle, setStoryTitle] = useState(sc?.story?.title ?? "");
  const [storyBody, setStoryBody] = useState(sc?.story?.body ?? "");
  const [storyPhotoUrl, setStoryPhotoUrl] = useState(sc?.story?.photo_url ?? "");
  const [philSteps, setPhilSteps] = useState<PhilosophyStep[]>(
    sc?.philosophy?.steps?.length ? sc.philosophy.steps : [emptyPhilosophyStep(), emptyPhilosophyStep()]
  );
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>(
    sc?.case_studies?.length ? sc.case_studies : [emptyCaseStudy()]
  );
  const [testimonials, setTestimonials] = useState<Testimonial[]>(
    sc?.testimonials?.length ? sc.testimonials : [emptyTestimonial()]
  );
  const [acceptances, setAcceptances] = useState<string>(
    sc?.acceptances?.join(", ") ?? ""
  );

  // ── Settings tab state
  const [aiEnabled, setAiEnabled] = useState(teacher.ai_coaching_enabled ?? false);
  const [liveEnabled, setLiveEnabled] = useState(teacher.live_sessions_enabled ?? false);
  const [emphasis, setEmphasis] = useState<'ai' | 'live' | 'equal'>(teacher.primary_emphasis ?? 'ai');

  // ── Publish tab state
  const [published, setPublished] = useState(teacher.storefront_published ?? false);

  // ── Tab and save state
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Compute live completeness from current form state
  const liveCompleteness = computeCompleteness({
    photo_url: photoUrl || null,
    bio: bio || null,
    quote: quote || null,
    subject: subject || null,
    pricing_config: teacher.pricing_config,
    storefront_content: caseStudies.some(cs => cs.student_label) || testimonials.some(t => t.quote)
      ? {
          hero: { headline: heroHeadline, subheadline: heroSubheadline },
          story: { title: storyTitle, body: storyBody, photo_url: storyPhotoUrl || null },
          philosophy: { steps: philSteps },
          case_studies: caseStudies.filter(cs => cs.student_label),
          testimonials: testimonials.filter(t => t.quote),
          acceptances: acceptances.split(",").map(s => s.trim()).filter(Boolean),
        }
      : initialCompleteness.score > 0 ? teacher.storefront_content : null,
    ai_coaching_enabled: aiEnabled,
    live_sessions_enabled: liveEnabled,
  });

  const firstName = teacher.name.split(" ")[0];

  function showSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/teacher/photo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Upload failed"); return; }
      setPhotoUrl(data.photo_url);
      showSaved();
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleDraftBio() {
    setDraftLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/draft-bio", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Draft failed"); return; }
      if (data.bio) setBio(data.bio);
      if (data.quote) setQuote(data.quote);
    } finally {
      setDraftLoading(false);
    }
  }

  async function saveProfile() {
    setSaving(true); setError(null); setSaved(false);
    try {
      const res = await fetch("/api/teacher/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bio || null,
          quote: quote || null,
          subject: subject || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Save failed"); return; }
      showSaved();
    } finally { setSaving(false); }
  }

  async function saveStorefront() {
    setSaving(true); setError(null); setSaved(false);
    try {
      const storefrontContent: StorefrontContent = {
        hero: { headline: heroHeadline, subheadline: heroSubheadline },
        story: { title: storyTitle, body: storyBody, photo_url: storyPhotoUrl || null },
        philosophy: { steps: philSteps.filter(s => s.label || s.body) },
        case_studies: caseStudies.filter(cs => cs.student_label),
        testimonials: testimonials.filter(t => t.quote),
        acceptances: acceptances.split(",").map(s => s.trim()).filter(Boolean),
      };
      const res = await fetch("/api/teacher/storefront", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront_content: storefrontContent }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Save failed"); return; }
      showSaved();
    } finally { setSaving(false); }
  }

  async function saveAgent() {
    setSaving(true); setError(null); setSaved(false);
    try {
      const moves = agentForm.signature_moves.split("\n").map(m => m.trim()).filter(Boolean);
      const res = await fetch("/api/teacher/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identity: agentForm.identity || undefined,
          core_beliefs: agentForm.core_beliefs || undefined,
          diagnostic_eye: agentForm.diagnostic_eye || undefined,
          voice: agentForm.voice || undefined,
          signature_moves: moves.length > 0 ? moves : undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Save failed"); return; }
      showSaved();
    } finally { setSaving(false); }
  }

  async function saveFeatureSettings() {
    setSaving(true); setError(null); setSaved(false);
    try {
      const res = await fetch("/api/teacher/storefront", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_coaching_enabled: aiEnabled,
          live_sessions_enabled: liveEnabled,
          primary_emphasis: emphasis,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Save failed"); return; }
      showSaved();
    } finally { setSaving(false); }
  }

  async function togglePublish() {
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/teacher/publish", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront_published: !published }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Save failed"); return; }
      setPublished(!published);
      showSaved();
    } finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors">
              ← Dashboard
            </Link>
            <span className="text-zinc-700">·</span>
            <span className="text-sm text-zinc-400">Profile Builder</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${liveCompleteness.score}%` }}
                />
              </div>
              <span className="text-xs text-zinc-500">{liveCompleteness.score}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(null); setSaved(false); }}
                className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-white text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10">
        {error && (
          <div className="mb-6 rounded-lg border border-red-800/40 bg-red-950/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ── PROFILE TAB ──────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Profile, {firstName}</h1>
              <p className="text-zinc-400 text-sm">Your short bio, quote, and photo shown across the platform.</p>
            </div>

            {/* Photo */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">Profile Photo</label>
              <div className="flex items-center gap-6">
                <div className="relative h-20 w-20 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                  {photoUrl ? (
                    <Image src={photoUrl} alt="Profile" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-600 text-2xl font-bold">
                      {firstName[0]}
                    </div>
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoUploading}
                    className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {photoUploading ? "Uploading…" : "Upload photo"}
                  </button>
                  <p className="mt-1.5 text-xs text-zinc-600">JPEG, PNG, or WebP · Max 5MB</p>
                </div>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-white mb-1">Subject / Role</label>
              <p className="text-xs text-zinc-500 mb-2">Shown as the label above your name on your storefront (e.g. "College Essay Coach")</p>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="College Essay Coach"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600"
              />
            </div>

            {/* Bio */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-white">Bio</label>
                <button
                  onClick={handleDraftBio}
                  disabled={draftLoading}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
                >
                  {draftLoading ? "Generating…" : "AI Draft ↗"}
                </button>
              </div>
              <p className="text-xs text-zinc-500 mb-2">2–4 sentences. Plain text.</p>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a short bio or click AI Draft to generate one from your agent profile…"
                rows={5}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 resize-none leading-relaxed"
              />
            </div>

            {/* Quote */}
            <div>
              <label className="block text-sm font-semibold text-white mb-1">Quote</label>
              <p className="text-xs text-zinc-500 mb-2">One memorable sentence — your philosophy in your own voice.</p>
              <textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="Your philosophy in one line…"
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-800">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="rounded-lg bg-white text-zinc-900 px-5 py-2.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : saved ? "Saved ✓" : "Save profile"}
              </button>
            </div>
          </div>
        )}

        {/* ── STOREFRONT TAB ────────────────────────────────────────────── */}
        {activeTab === 'storefront' && (
          <div className="space-y-10">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Storefront Content</h1>
              <p className="text-zinc-400 text-sm">The rich content shown on your public teacher page.</p>
            </div>

            {/* Hero */}
            <section>
              <h2 className="text-base font-semibold text-zinc-300 mb-4">Hero</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Headline (tagline)</label>
                  <input
                    type="text"
                    value={heroHeadline}
                    onChange={(e) => setHeroHeadline(e.target.value)}
                    placeholder="Your story is already there. Let me help you find it."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Subheadline (credentials)</label>
                  <input
                    type="text"
                    value={heroSubheadline}
                    onChange={(e) => setHeroSubheadline(e.target.value)}
                    placeholder="Yale '25 · Magna Cum Laude · Phi Beta Kappa"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>
            </section>

            {/* Story */}
            <section>
              <h2 className="text-base font-semibold text-zinc-300 mb-4">My Story</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Title</label>
                  <input
                    type="text"
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    placeholder="Hi, I'm Sam."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Body (separate paragraphs with blank lines)</label>
                  <textarea
                    value={storyBody}
                    onChange={(e) => setStoryBody(e.target.value)}
                    placeholder="Your story…"
                    rows={8}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 resize-none leading-relaxed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Photo URL (optional)</label>
                  <input
                    type="text"
                    value={storyPhotoUrl}
                    onChange={(e) => setStoryPhotoUrl(e.target.value)}
                    placeholder="/StoryLab%20Sam%20talking.png"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>
            </section>

            {/* Philosophy Steps */}
            <section>
              <h2 className="text-base font-semibold text-zinc-300 mb-4">Philosophy (2 steps)</h2>
              <div className="space-y-6">
                {philSteps.map((step, i) => (
                  <div key={i} className="rounded-xl border border-zinc-800 p-5 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Step {i + 1}</p>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">Label</label>
                      <input
                        type="text"
                        value={step.label}
                        onChange={(e) => {
                          const updated = [...philSteps];
                          updated[i] = { ...updated[i], label: e.target.value };
                          setPhilSteps(updated);
                        }}
                        placeholder={i === 0 ? "My Philosophy" : "How I'm Different"}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">Body</label>
                      <textarea
                        value={step.body}
                        onChange={(e) => {
                          const updated = [...philSteps];
                          updated[i] = { ...updated[i], body: e.target.value };
                          setPhilSteps(updated);
                        }}
                        rows={5}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 resize-none leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">Photo URL (optional)</label>
                      <input
                        type="text"
                        value={step.photo_url ?? ""}
                        onChange={(e) => {
                          const updated = [...philSteps];
                          updated[i] = { ...updated[i], photo_url: e.target.value || null };
                          setPhilSteps(updated);
                        }}
                        placeholder={i === 0 ? "/in%20the%20crowd.png" : "/photo-1.png"}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Case Studies */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-zinc-300">Student Stories (up to 3)</h2>
                {caseStudies.length < 3 && (
                  <button
                    onClick={() => setCaseStudies([...caseStudies, emptyCaseStudy()])}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    + Add story
                  </button>
                )}
              </div>
              <div className="space-y-6">
                {caseStudies.map((cs, i) => (
                  <div key={i} className="rounded-xl border border-zinc-800 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Story {i + 1}</p>
                      {caseStudies.length > 1 && (
                        <button
                          onClick={() => setCaseStudies(caseStudies.filter((_, j) => j !== i))}
                          className="text-xs text-red-500 hover:text-red-400"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {(["student_label", "outcome", "teaser", "challenge", "what_changed"] as const).map((field) => (
                      <div key={field}>
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5 capitalize">
                          {field.replace("_", " ")}
                        </label>
                        <textarea
                          value={cs[field]}
                          onChange={(e) => {
                            const updated = [...caseStudies];
                            updated[i] = { ...updated[i], [field]: e.target.value };
                            setCaseStudies(updated);
                          }}
                          rows={field === "teaser" || field === "student_label" || field === "outcome" ? 2 : 4}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 resize-none leading-relaxed"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>

            {/* Testimonials */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-zinc-300">Testimonials (up to 5)</h2>
                {testimonials.length < 5 && (
                  <button
                    onClick={() => setTestimonials([...testimonials, emptyTestimonial()])}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    + Add testimonial
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {testimonials.map((t, i) => (
                  <div key={i} className="rounded-xl border border-zinc-800 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">Testimonial {i + 1}</p>
                      {testimonials.length > 1 && (
                        <button
                          onClick={() => setTestimonials(testimonials.filter((_, j) => j !== i))}
                          className="text-xs text-red-500 hover:text-red-400"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">Quote</label>
                      <textarea
                        value={t.quote}
                        onChange={(e) => {
                          const updated = [...testimonials];
                          updated[i] = { ...updated[i], quote: e.target.value };
                          setTestimonials(updated);
                        }}
                        rows={3}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 resize-none leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">Attribution</label>
                      <input
                        type="text"
                        value={t.attribution}
                        onChange={(e) => {
                          const updated = [...testimonials];
                          updated[i] = { ...updated[i], attribution: e.target.value };
                          setTestimonials(updated);
                        }}
                        placeholder="Student attending University of Chicago"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Acceptances */}
            <section>
              <h2 className="text-base font-semibold text-zinc-300 mb-2">Acceptances</h2>
              <p className="text-xs text-zinc-500 mb-3">Comma-separated list of schools (for reference — the logo marquee is platform-wide for now).</p>
              <input
                type="text"
                value={acceptances}
                onChange={(e) => setAcceptances(e.target.value)}
                placeholder="Harvard, Yale, Princeton, Stanford…"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600"
              />
            </section>

            <div className="flex justify-end pt-4 border-t border-zinc-800">
              <button
                onClick={saveStorefront}
                disabled={saving}
                className="rounded-lg bg-white text-zinc-900 px-5 py-2.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : saved ? "Saved ✓" : "Save storefront"}
              </button>
            </div>
          </div>
        )}

        {/* ── AI AGENT TAB ──────────────────────────────────────────────── */}
        {activeTab === 'agent' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">AI Agent Profile</h1>
              <p className="text-zinc-400 text-sm leading-relaxed">
                These five questions shape how your AI interacts with students. The more specific you are, the more your AI sounds like you.
              </p>
            </div>

            <div className="space-y-10">
              {AGENT_QUESTIONS.map((q, i) => {
                const value = q.key === "signature_moves" ? agentForm.signature_moves : agentForm[q.key];
                return (
                  <div key={q.key}>
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-zinc-600">{i + 1}</span>
                        <h3 className="text-sm font-semibold text-white">{q.label}</h3>
                      </div>
                      <p className="text-xs text-zinc-500 ml-4">{q.hint}</p>
                    </div>
                    <textarea
                      value={value}
                      onChange={(e) => setAgentForm((f) => ({ ...f, [q.key]: e.target.value }))}
                      placeholder={q.placeholder}
                      rows={"isMultiline" in q && q.isMultiline ? 4 : 5}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 resize-none leading-relaxed"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-800">
              <button
                onClick={saveAgent}
                disabled={saving}
                className="rounded-lg bg-white text-zinc-900 px-5 py-2.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : saved ? "Saved ✓" : "Save AI profile"}
              </button>
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ─────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Feature Settings</h1>
              <p className="text-zinc-400 text-sm">Control which services you offer and how they're presented.</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border border-zinc-800 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-white">AI Coaching</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Students can message your AI coach</p>
                </div>
                <button
                  onClick={() => setAiEnabled(!aiEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                    aiEnabled ? "bg-emerald-500" : "bg-zinc-700"
                  }`}
                  role="switch"
                  aria-checked={aiEnabled}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
                      aiEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-zinc-800 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-white">Live Sessions</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Students can book live video sessions</p>
                </div>
                <button
                  onClick={() => setLiveEnabled(!liveEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                    liveEnabled ? "bg-emerald-500" : "bg-zinc-700"
                  }`}
                  role="switch"
                  aria-checked={liveEnabled}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
                      liveEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="rounded-xl border border-zinc-800 px-5 py-4">
                <p className="text-sm font-semibold text-white mb-1">Primary Emphasis</p>
                <p className="text-xs text-zinc-500 mb-3">How your offerings are ordered and presented on your storefront</p>
                <select
                  value={emphasis}
                  onChange={(e) => setEmphasis(e.target.value as 'ai' | 'live' | 'equal')}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
                >
                  <option value="ai">AI First</option>
                  <option value="live">Live First</option>
                  <option value="equal">Equal</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-800">
              <button
                onClick={saveFeatureSettings}
                disabled={saving}
                className="rounded-lg bg-white text-zinc-900 px-5 py-2.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : saved ? "Saved ✓" : "Save settings"}
              </button>
            </div>
          </div>
        )}

        {/* ── PUBLISH TAB ──────────────────────────────────────────────── */}
        {activeTab === 'publish' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">Publish</h1>
              <p className="text-zinc-400 text-sm">Control whether your public storefront is live.</p>
            </div>

            {/* Score bar */}
            <div className="rounded-xl border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">Profile Completeness</p>
                <span className="text-2xl font-bold text-white">{liveCompleteness.score}<span className="text-sm font-normal text-zinc-500">%</span></span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    liveCompleteness.score >= 80 ? "bg-emerald-500" : liveCompleteness.score >= 50 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${liveCompleteness.score}%` }}
                />
              </div>
              {liveCompleteness.missingRequired.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Required to publish</p>
                  <ul className="space-y-1">
                    {liveCompleteness.missingRequired.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-zinc-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {liveCompleteness.canPublish && (
                <p className="mt-4 text-sm text-emerald-400 font-medium">
                  Your profile meets all requirements to publish.
                </p>
              )}
            </div>

            {/* Score breakdown */}
            <div className="rounded-xl border border-zinc-800 p-6">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Score Breakdown</p>
              <div className="space-y-2">
                {[
                  { key: 'photo_url', label: 'Profile photo', max: 20 },
                  { key: 'bio', label: 'Bio', max: 15 },
                  { key: 'quote', label: 'Quote', max: 10 },
                  { key: 'subject', label: 'Subject / role', max: 10 },
                  { key: 'case_study', label: 'Student story', max: 15 },
                  { key: 'testimonial', label: 'Testimonial', max: 10 },
                  { key: 'flags', label: 'Coaching enabled', max: 10 },
                  { key: 'pricing', label: 'Pricing', max: 10 },
                ].map(({ key, label, max }) => {
                  const earned = liveCompleteness.breakdown[key] ?? 0;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${earned > 0 ? "bg-emerald-500" : "bg-zinc-700"}`} />
                      <p className="text-sm text-zinc-400 flex-1">{label}</p>
                      <p className="text-xs text-zinc-600">{earned}/{max}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Publish toggle */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-white">
                  {published ? "Storefront is live" : "Storefront is private"}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {published
                    ? `Visible at /teachers/${teacher.id}`
                    : "Not visible to the public"}
                </p>
              </div>
              <button
                onClick={togglePublish}
                disabled={saving || (!published && !liveCompleteness.canPublish)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-40 ${
                  published ? "bg-emerald-500" : "bg-zinc-700"
                }`}
                role="switch"
                aria-checked={published}
                title={!liveCompleteness.canPublish && !published ? "Complete your profile first" : undefined}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
                    published ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            {!liveCompleteness.canPublish && !published && (
              <p className="text-xs text-zinc-600">Complete the required items above before publishing.</p>
            )}
            {saved && <p className="text-sm text-emerald-400">Saved ✓</p>}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  agent_config: Record<string, unknown>;
}

const QUESTIONS = [
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
    isTextarea: true,
    isMultiline: true,
  },
] as const;

export default function SettingsClient({ teacher }: { teacher: Teacher }) {
  const config = teacher.agent_config ?? {};
  const [form, setForm] = useState({
    identity: typeof config.identity === "string" ? config.identity : "",
    core_beliefs: typeof config.core_beliefs === "string" ? config.core_beliefs : "",
    diagnostic_eye: typeof config.diagnostic_eye === "string" ? config.diagnostic_eye : "",
    voice: typeof config.voice === "string" ? config.voice : "",
    signature_moves: Array.isArray(config.signature_moves)
      ? (config.signature_moves as string[]).join("\n")
      : "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const moves = form.signature_moves
        .split("\n")
        .map((m) => m.trim())
        .filter(Boolean);

      const res = await fetch("/api/teacher/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identity: form.identity || undefined,
          core_beliefs: form.core_beliefs || undefined,
          diagnostic_eye: form.diagnostic_eye || undefined,
          voice: form.voice || undefined,
          signature_moves: moves.length > 0 ? moves : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Save failed");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const firstName = teacher.name.split(" ")[0];
  const filledCount = [form.identity, form.core_beliefs, form.diagnostic_eye, form.voice, form.signature_moves].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors">
              ← Dashboard
            </Link>
            <span className="text-zinc-700">·</span>
            <span className="text-sm text-zinc-400">Teaching Profile</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-600">{filledCount}/5 answered</span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-white text-zinc-900 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save profile"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-white mb-2">Your teaching profile, {firstName}</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            These five questions shape how your AI interacts with students. You can skip any answer and come back later — a partial profile still helps.
            The more specific you are, the more your AI sounds like you.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-800/40 bg-red-950/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-10">
          {QUESTIONS.map((q, i) => {
            const value = q.key === "signature_moves" ? form.signature_moves : form[q.key];
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [q.key]: e.target.value }))
                  }
                  placeholder={q.placeholder}
                  rows={"isMultiline" in q && q.isMultiline ? 4 : 5}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 resize-none leading-relaxed"
                />
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-between pt-8 border-t border-zinc-800">
          <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            ← Back to dashboard
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-white text-zinc-900 px-5 py-2.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

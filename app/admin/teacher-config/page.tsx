"use client";

import { useState, useEffect } from "react";

interface AgentConfig {
  identity?: string;
  core_beliefs?: string;
  diagnostic_eye?: string;
  voice?: string;
  signature_moves?: string[];
}

interface TeacherRow {
  id: string;
  name: string;
  agent_config: AgentConfig;
  updated_at: string;
}

const FIELD_PROMPTS: Record<keyof Omit<AgentConfig, "signature_moves">, string> = {
  identity:
    "Who are you, what's your teaching origin story, what do you lead with? " +
    "(e.g. 'I'm Sam Ahn. Writing coach, Yale graduate... You're good at this and you know it, but you don't lead with credentials...')",
  core_beliefs:
    "What do you believe about writing, essays, or your subject that shapes how you coach? " +
    "Write your beliefs as statements, not principles. Be specific.",
  diagnostic_eye:
    "What do you notice in bad drafts that others miss? " +
    "What patterns do you see repeatedly in students' work?",
  voice:
    "How do you talk to students? Describe your tone, your style, what makes your coaching voice distinct. " +
    "Include: when you're blunt, when you're warm, how you handle stuck students.",
};

export default function TeacherConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [teacher, setTeacher] = useState<TeacherRow | null>(null);

  const [identity, setIdentity] = useState("");
  const [coreBeliefs, setCoreBeliefs] = useState("");
  const [diagnosticEye, setDiagnosticEye] = useState("");
  const [voice, setVoice] = useState("");
  const [moves, setMoves] = useState<string[]>(["", "", "", "", ""]);

  useEffect(() => {
    fetch("/api/admin/teacher-config")
      .then((r) => r.json())
      .then((data: TeacherRow) => {
        setTeacher(data);
        const c = data.agent_config ?? {};
        setIdentity(c.identity ?? "");
        setCoreBeliefs(c.core_beliefs ?? "");
        setDiagnosticEye(c.diagnostic_eye ?? "");
        setVoice(c.voice ?? "");
        const savedMoves = c.signature_moves ?? [];
        const padded = [...savedMoves, "", "", "", "", ""].slice(0, 5);
        setMoves(padded);
      })
      .catch(() => setError("Failed to load config"))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const agent_config: AgentConfig = {
      identity: identity.trim(),
      core_beliefs: coreBeliefs.trim(),
      diagnostic_eye: diagnosticEye.trim(),
      voice: voice.trim(),
      signature_moves: moves.map((m) => m.trim()).filter(Boolean),
    };

    const res = await fetch("/api/admin/teacher-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_config }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save");
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function updateMove(index: number, value: string) {
    setMoves((prev) => prev.map((m, i) => (i === index ? value : m)));
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="text-xs text-zinc-400">Loading…</span>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white">
      {/* Top bar */}
      <div className="flex h-10 items-center justify-between border-b border-zinc-200 px-4">
        <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
          StoryLab · Agent Config
        </span>
        <div className="flex items-center gap-4">
          <a href="/admin/dashboard" className="text-xs text-zinc-400 hover:text-zinc-600">
            ← Dashboard
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-8 space-y-8">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">
            {teacher?.name ?? "Teacher"} Agent Config
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Define your AI agent&apos;s identity, beliefs, and coaching voice. These fields replace
            the hardcoded system prompt when set. Leave empty to use the built-in Sam Ahn prompt.
          </p>
          {teacher?.updated_at && (
            <p className="mt-1 text-xs text-zinc-400">
              Last saved:{" "}
              {new Date(teacher.updated_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        {/* Identity */}
        <ConfigSection
          label="Identity"
          hint={FIELD_PROMPTS.identity}
          value={identity}
          onChange={setIdentity}
          rows={6}
        />

        {/* Core beliefs */}
        <ConfigSection
          label="Core Beliefs"
          hint={FIELD_PROMPTS.core_beliefs}
          value={coreBeliefs}
          onChange={setCoreBeliefs}
          rows={6}
        />

        {/* Diagnostic eye */}
        <ConfigSection
          label="Diagnostic Eye"
          hint={FIELD_PROMPTS.diagnostic_eye}
          value={diagnosticEye}
          onChange={setDiagnosticEye}
          rows={5}
        />

        {/* Voice */}
        <ConfigSection
          label="Voice & Style"
          hint={FIELD_PROMPTS.voice}
          value={voice}
          onChange={setVoice}
          rows={5}
        />

        {/* Signature moves */}
        <div>
          <label className="block text-sm font-medium text-zinc-900 mb-1">
            Signature Moves
          </label>
          <p className="mb-3 text-xs text-zinc-500">
            3–5 specific coaching interventions you always make. Each is a distinct move with a
            name and description.
          </p>
          <div className="space-y-2">
            {moves.map((move, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-2 w-4 shrink-0 text-xs text-zinc-400">{i + 1}.</span>
                <textarea
                  value={move}
                  onChange={(e) => updateMove(i, e.target.value)}
                  rows={2}
                  placeholder={`Move ${i + 1} — e.g. "The second why: when a student gives a surface answer, ask why again until they hit something they don't know how to say."`}
                  className="flex-1 rounded border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-500 resize-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : saved ? "Saved!" : "Save config"}
          </button>
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            {showPreview ? "Hide preview" : "Preview assembled prompt"}
          </button>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="rounded border border-zinc-200 bg-zinc-50 p-4">
            <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Assembled prompt preview
            </p>
            <pre className="whitespace-pre-wrap text-xs text-zinc-700 leading-relaxed">
              {[
                identity && `## IDENTITY\n${identity}`,
                coreBeliefs && `\n\n## CORE BELIEFS\n${coreBeliefs}`,
                diagnosticEye && `\n\n## DIAGNOSTIC EYE\n${diagnosticEye}`,
                voice && `\n\n## VOICE & STYLE\n${voice}`,
                moves.some((m) => m.trim()) &&
                  `\n\n## SIGNATURE MOVES\n${moves
                    .map((m, i) => (m.trim() ? `${i + 1}. ${m.trim()}` : null))
                    .filter(Boolean)
                    .join("\n")}`,
              ]
                .filter(Boolean)
                .join("") || "(No config set — will use built-in Sam Ahn prompt)"}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigSection({
  label,
  hint,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-900 mb-1">{label}</label>
      <p className="mb-2 text-xs text-zinc-500">{hint}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-500 resize-y"
      />
      <p className="mt-1 text-right text-xs text-zinc-400">{value.length}/5000</p>
    </div>
  );
}

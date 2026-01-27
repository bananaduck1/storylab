"use client";

import { useState, useRef, useCallback, type FormEvent, type DragEvent } from "react";

/* ── constants ── */
const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPT = ".txt,.pdf,.docx";
const ACCEPTED_TYPES = new Set([
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ACCEPTED_EXTS = /\.(txt|pdf|docx)$/i;
function isAcceptedFile(f: File) {
  return ACCEPTED_TYPES.has(f.type) || ACCEPTED_EXTS.test(f.name);
}

const RUBRIC_LABELS: Record<string, string> = {
  R001: "Causal structure",
  R002: "Psychological depth",
  R003: "Specificity & detail",
  R004: "Insight over achievement",
  R005: "Show vs. tell",
  R006: "Voice & restraint",
  R007: "Tonal balance",
  R008: "Vulnerability & boundaries",
};

const TIER_OPTIONS = [
  { value: "free", label: "Free", desc: "Diagnosis only" },
  { value: "plus", label: "Plus", desc: "Coaching + revision paths" },
  { value: "pro", label: "Pro", desc: "Full strategic coaching" },
] as const;

type Tier = "free" | "plus" | "pro";

/* ── types (mirrors AnalysisOutput) ── */
type EvidenceSpan = { quote: string; why_it_matters: string };
type RubricScore = {
  rubric_id: string;
  score: number;
  evidence_spans: EvidenceSpan[];
  notes: string;
};
type RevisionPath = { label: string; description: string };
type AnalysisResult = {
  analysis: {
    rubric_scores: RubricScore[];
    weakest_dimensions: string[];
    dominant_misconception: {
      misconception_id: string;
      confidence: number;
      evidence_spans: EvidenceSpan[];
      why_this_matters: string;
    };
    recommended_intervention: {
      intervention_id: string;
      rationale: string;
      effort_level: string;
      output_format: string;
    };
  };
  student_output: {
    headline: string;
    what_to_fix_first: string;
    brief_explanation: string;
    concept_taught: string;
    one_assignment: {
      title: string;
      instructions: string;
      time_estimate_minutes: number;
      success_check: string;
    };
    optional_next_step: string;
    revision_paths: RevisionPath[];
    questions_for_student: string[];
  };
};

/* ── score helpers ── */
function scoreColor(s: number) {
  if (s <= 2) return "bg-red-400";
  if (s === 3) return "bg-amber-400";
  return "bg-emerald-500";
}
function scoreLabel(s: number) {
  if (s <= 2) return "Needs work";
  if (s === 3) return "Developing";
  if (s === 4) return "Strong";
  return "Excellent";
}

/* ── formatted result ── */
function AnalysisReport({ data }: { data: AnalysisResult }) {
  const { analysis, student_output: so } = data;

  return (
    <div className="mt-10 space-y-10">
      {/* Headline */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
          {so.headline}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-zinc-700">
          {so.brief_explanation}
        </p>
      </section>

      {/* Concept taught */}
      {so.concept_taught && (
        <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Concept to learn
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-800">
            {so.concept_taught}
          </p>
        </section>
      )}

      {/* What to fix first */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          What to fix first
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-800">
          {so.what_to_fix_first}
        </p>
      </section>

      {/* Revision paths (Plus/Pro only) */}
      {so.revision_paths && so.revision_paths.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold tracking-tight text-zinc-950">
            Two ways to revise
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {so.revision_paths.map((path, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-5 ${
                  i === 0
                    ? "border-zinc-200 bg-white"
                    : "border-amber-200 bg-amber-50/50"
                }`}
              >
                <h4 className="text-sm font-semibold text-zinc-900">
                  {path.label}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                  {path.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rubric scores */}
      <section>
        <h3 className="text-lg font-semibold tracking-tight text-zinc-950">
          Rubric scores
        </h3>
        <div className="mt-4 space-y-4">
          {analysis.rubric_scores.map((rs) => (
            <div key={rs.rubric_id}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-900">
                  {RUBRIC_LABELS[rs.rubric_id] ?? rs.rubric_id}
                </span>
                <span className="text-xs text-zinc-500">
                  {rs.score}/5 — {scoreLabel(rs.score)}
                </span>
              </div>
              {/* bar */}
              <div className="mt-1.5 h-2 w-full rounded-full bg-zinc-100">
                <div
                  className={`h-2 rounded-full transition-all ${scoreColor(rs.score)}`}
                  style={{ width: `${(rs.score / 5) * 100}%` }}
                />
              </div>
              {rs.notes && (
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                  {rs.notes}
                </p>
              )}
              {rs.evidence_spans.length > 0 && (
                <div className="mt-2 space-y-2">
                  {rs.evidence_spans.map((ev, i) => (
                    <blockquote
                      key={i}
                      className="border-l-2 border-zinc-200 pl-3 text-xs leading-relaxed"
                    >
                      <p className="italic text-zinc-700">&ldquo;{ev.quote}&rdquo;</p>
                      <p className="mt-0.5 text-zinc-500">{ev.why_it_matters}</p>
                    </blockquote>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Assignment */}
      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Your assignment
        </h3>
        <p className="mt-2 text-base font-semibold text-zinc-950">
          {so.one_assignment.title}
        </p>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-700">
          {so.one_assignment.instructions.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
          <span>~{so.one_assignment.time_estimate_minutes} min</span>
          <span className="text-zinc-300">|</span>
          <span>{so.one_assignment.success_check}</span>
        </div>
      </section>

      {/* Questions for student (Plus/Pro only) */}
      {so.questions_for_student && so.questions_for_student.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Questions to think about
          </h3>
          <ul className="mt-3 space-y-2">
            {so.questions_for_student.map((q, i) => (
              <li key={i} className="text-sm leading-relaxed text-zinc-800">
                {q}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Optional next step */}
      {so.optional_next_step && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Optional next step
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-700">
            {so.optional_next_step}
          </p>
        </section>
      )}

      {/* Key insight (misconception) */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Key insight
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-800">
          {analysis.dominant_misconception.why_this_matters}
        </p>
        {analysis.dominant_misconception.evidence_spans.length > 0 && (
          <div className="mt-3 space-y-2">
            {analysis.dominant_misconception.evidence_spans.map((ev, i) => (
              <blockquote
                key={i}
                className="border-l-2 border-zinc-200 pl-3 text-xs leading-relaxed"
              >
                <p className="italic text-zinc-700">&ldquo;{ev.quote}&rdquo;</p>
                <p className="mt-0.5 text-zinc-500">{ev.why_it_matters}</p>
              </blockquote>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ── page ── */
export default function AiEditorPage() {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [tier, setTier] = useState<Tier>("free");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File | null) => {
    if (!f) return;
    if (!isAcceptedFile(f)) {
      setError("Unsupported file type. Please upload a .txt, .pdf, or .docx file.");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("File exceeds the 10 MB limit.");
      return;
    }
    setError(null);
    setFile(f);
  }, []);

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  }
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
  }
  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!file) {
      setError("Please select a file.");
      return;
    }

    const body = new FormData();
    if (prompt.trim()) body.append("prompt", prompt.trim());
    body.append("file", file);
    body.append("tier", tier);

    setLoading(true);
    try {
      const res = await fetch("/api/test-analysis", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? `Server error ${res.status}`);
      } else {
        setResult(json as AnalysisResult);
      }
    } catch {
      setError("Network error — could not reach server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        AI Essay Editor
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">
        Upload an essay (.txt, .pdf, or .docx) and the AI will analyze the text
        and return structured feedback. You can optionally add a prompt for extra context.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {/* Drop zone */}
        <div>
          <label className="block text-sm font-medium text-zinc-900 mb-1">
            Essay file{" "}
            <span className="font-normal text-zinc-500">(txt, pdf, or docx — max 10 MB)</span>
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileRef.current?.click()}
            className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
              dragging
                ? "border-zinc-900 bg-zinc-50"
                : file
                  ? "border-zinc-300 bg-zinc-50"
                  : "border-zinc-300 bg-white hover:border-zinc-400 hover:bg-zinc-50"
            }`}
          >
            {file ? (
              <p className="text-sm text-zinc-700">
                <span className="font-medium">{file.name}</span>{" "}
                <span className="text-zinc-500">
                  ({(file.size / 1024).toFixed(0)} KB)
                </span>
              </p>
            ) : (
              <>
                <svg
                  className="mb-2 h-8 w-8 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3.75 3.75 0 013.57 5.495A3.001 3.001 0 0118 19.5H6.75z"
                  />
                </svg>
                <p className="text-sm text-zinc-600">
                  <span className="font-medium text-zinc-900">Click to upload</span> or drag
                  and drop
                </p>
                <p className="mt-1 text-xs text-zinc-500">.txt, .pdf, or .docx</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {file && (
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="mt-2 text-xs text-zinc-500 underline hover:text-zinc-700"
            >
              Remove file
            </button>
          )}
        </div>

        {/* Tier selector */}
        <div>
          <label className="block text-sm font-medium text-zinc-900 mb-2">
            Coaching level
          </label>
          <div className="flex gap-3">
            {TIER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTier(opt.value)}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                  tier === opt.value
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
                }`}
              >
                <span className="block text-sm font-semibold">{opt.label}</span>
                <span className={`block text-xs mt-0.5 ${
                  tier === opt.value ? "text-zinc-300" : "text-zinc-500"
                }`}>
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-zinc-900">
            Prompt{" "}
            <span className="font-normal text-zinc-500">(optional)</span>
          </label>
          <textarea
            id="prompt"
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            placeholder="e.g. Focus on narrative structure and voice."
          />
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {result && <AnalysisReport data={result} />}
    </div>
  );
}

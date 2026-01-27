"use client";

import { useState, useRef, type FormEvent } from "react";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPT = ".txt,.pdf,.docx";

export default function AiEditorPage() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please select a file.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File exceeds the 10 MB limit.");
      return;
    }
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }

    const body = new FormData();
    body.append("prompt", prompt.trim());
    body.append("file", file);

    setLoading(true);
    try {
      const res = await fetch("/api/test-analysis", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? `Server error ${res.status}`);
      } else {
        setResult(JSON.stringify(json, null, 2));
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
        Upload an essay (.txt, .pdf, or .docx) and provide a prompt. The AI will
        analyze the text and return structured feedback.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-zinc-900">
            Prompt
          </label>
          <textarea
            id="prompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            placeholder="e.g. Analyze this college essay for clarity and narrative structure."
          />
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium text-zinc-900">
            Essay file{" "}
            <span className="font-normal text-zinc-500">(txt, pdf, or docx — max 10 MB)</span>
          </label>
          <input
            id="file"
            type="file"
            accept={ACCEPT}
            ref={fileRef}
            className="mt-1 block text-sm text-zinc-700 file:mr-3 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
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

      {result && (
        <pre className="mt-6 max-h-[60vh] overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-800">
          {result}
        </pre>
      )}
    </div>
  );
}

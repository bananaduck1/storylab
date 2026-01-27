"use client";

import { useState, useRef, useCallback, type FormEvent, type DragEvent } from "react";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPT = ".txt,.pdf,.docx";
const ACCEPTED_TYPES = new Set([
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ACCEPTED_EXTS = /\.(txt|pdf|docx)$/i;

function isAcceptedFile(file: File) {
  return ACCEPTED_TYPES.has(file.type) || ACCEPTED_EXTS.test(file.name);
}

export default function AiEditorPage() {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
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
    const f = e.dataTransfer.files[0];
    handleFile(f ?? null);
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
    if (prompt.trim()) {
      body.append("prompt", prompt.trim());
    }
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

      {result && (
        <pre className="mt-6 max-h-[60vh] overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-800">
          {result}
        </pre>
      )}
    </div>
  );
}

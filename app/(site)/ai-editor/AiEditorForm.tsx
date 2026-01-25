"use client";

import type { DragEvent, FormEvent } from "react";
import { useMemo, useRef, useState } from "react";

type Status = "idle" | "uploading" | "processing" | "done" | "error";
type Result =
  | { kind: "json"; data: Record<string, unknown> }
  | { kind: "text"; data: string };

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = [".txt", "text/plain"].join(",");

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const readStream = async (response: Response) => {
  const reader = response.body?.getReader();
  if (!reader) {
    return "";
  }
  const decoder = new TextDecoder();
  let result = "";
  let done = false;

  while (!done) {
    const chunk = await reader.read();
    done = chunk.done;
    if (chunk.value) {
      result += decoder.decode(chunk.value, { stream: true });
    }
  }

  return result;
};

export function AiEditorForm() {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const statusLabel = useMemo(() => {
    switch (status) {
      case "uploading":
        return "Uploading…";
      case "processing":
        return "Processing…";
      case "done":
        return "Done";
      case "error":
        return "Error";
      default:
        return "Idle";
    }
  }, [status]);

  const resetFile = () => {
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFileSelection = (selected: File | null) => {
    if (!selected) return;
    if (selected.size > MAX_FILE_SIZE) {
      setError("File size exceeds the 10MB limit.");
      setStatus("error");
      return;
    }
    setError(null);
    if (status === "error") {
      setStatus("idle");
    }
    setFile(selected);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) {
      handleFileSelection(dropped);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      setStatus("error");
      return;
    }

    setError(null);
    setResult(null);
    setStatus("uploading");

    try {
      const formData = new FormData();
      formData.append("prompt", prompt.trim());
      if (file) {
        formData.append("file", file);
      }

      const response = await fetch("/api/editor", {
        method: "POST",
        body: formData,
      });

      setStatus("processing");

      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok) {
        const retryAfter = response.headers.get("retry-after");
        if (response.status === 429) {
          const waitMessage = retryAfter
            ? ` Please wait ${retryAfter} seconds before trying again.`
            : " Please wait a moment before trying again.";
          throw new Error(`Too many requests.${waitMessage}`);
        }
        if (contentType.includes("application/json")) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Request failed.");
        }
        const text = await response.text();
        throw new Error(text || "Request failed.");
      }

      if (contentType.includes("text/event-stream") && response.body) {
        const streamText = await readStream(response);
        setResult({ kind: "text", data: streamText.trim() });
      } else if (contentType.includes("application/json")) {
        const data = (await response.json()) as Record<string, unknown>;
        setResult({ kind: "json", data });
      } else {
        const text = await response.text();
        setResult({ kind: "text", data: text });
      }

      setStatus("done");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      setStatus("error");
    }
  };

  const summary = useMemo(() => {
    if (!result || result.kind !== "json") return null;
    const data = result.data as Record<string, any>;
    const studentOutput = data.student_output as Record<string, string> | undefined;
    const analysis = data.analysis as Record<string, any> | undefined;
    return {
      headline: studentOutput?.headline,
      focus: studentOutput?.what_to_fix_first,
      explanation: studentOutput?.brief_explanation,
      assignment: studentOutput?.one_assignment,
      nextStep: studentOutput?.optional_next_step,
      misconception: analysis?.dominant_misconception?.misconception_id,
      intervention: analysis?.recommended_intervention?.intervention_id,
    };
  }, [result]);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-3">
        <label className="text-sm font-semibold text-zinc-900" htmlFor="prompt">
          Prompt
        </label>
        <textarea
          id="prompt"
          name="prompt"
          required
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Tell the editor what you want help with or paste your essay here."
          rows={6}
          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-semibold text-zinc-900">Upload file</label>
          {file ? (
            <button
              type="button"
              onClick={resetFile}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900"
            >
              Remove file
            </button>
          ) : null}
        </div>
        <div
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
          className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center text-sm text-zinc-600"
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={(event) => handleFileSelection(event.target.files?.[0] ?? null)}
            className="hidden"
          />
          <p className="text-sm font-medium text-zinc-900">
            Drag & drop a file, or{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-zinc-900 underline underline-offset-4"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-zinc-500">Accepts TXT files up to 10MB.</p>
          {file ? (
            <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-xs text-zinc-700">
              <p className="font-semibold text-zinc-900">{file.name}</p>
              <p>{formatBytes(file.size)}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "uploading" || status === "processing"}
          className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-zinc-900/20 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {status === "uploading" || status === "processing" ? "Running…" : "Run Editor"}
        </button>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Status: {statusLabel}
        </span>
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-600">
          Results
        </h2>
        {result ? (
          <div className="mt-4 space-y-4 text-sm text-zinc-800">
            {result.kind === "json" ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Summary
                    </p>
                    <ul className="mt-3 space-y-3 text-sm">
                      {summary?.headline ? (
                        <li>
                          <span className="font-semibold text-zinc-900">Headline:</span>{" "}
                          {summary.headline}
                        </li>
                      ) : null}
                      {summary?.focus ? (
                        <li>
                          <span className="font-semibold text-zinc-900">Focus:</span>{" "}
                          {summary.focus}
                        </li>
                      ) : null}
                      {summary?.explanation ? (
                        <li>
                          <span className="font-semibold text-zinc-900">Why it matters:</span>{" "}
                          {summary.explanation}
                        </li>
                      ) : null}
                      {summary?.assignment ? (
                        <li>
                          <span className="font-semibold text-zinc-900">Assignment:</span>{" "}
                          {summary.assignment}
                        </li>
                      ) : null}
                      {summary?.nextStep ? (
                        <li>
                          <span className="font-semibold text-zinc-900">Optional next step:</span>{" "}
                          {summary.nextStep}
                        </li>
                      ) : null}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Diagnostics
                    </p>
                    <ul className="mt-3 space-y-3 text-sm">
                      {summary?.misconception ? (
                        <li>
                          <span className="font-semibold text-zinc-900">Misconception:</span>{" "}
                          {summary.misconception}
                        </li>
                      ) : null}
                      {summary?.intervention ? (
                        <li>
                          <span className="font-semibold text-zinc-900">Intervention:</span>{" "}
                          {summary.intervention}
                        </li>
                      ) : null}
                    </ul>
                  </div>
                </div>
                <details className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
                    Raw JSON
                  </summary>
                  <pre className="mt-3 overflow-auto text-xs text-zinc-700">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              </>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-zinc-800">
                {result.data}
              </pre>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">
            Results will appear here once the editor finishes.
          </p>
        )}
      </div>
    </form>
  );
}

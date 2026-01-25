"use client";

import { useState } from "react";

type EditorResponse = {
  prompt: string;
  filename: string;
  fileType: string;
  text: string;
};

export function EditorForm() {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [response, setResponse] = useState<EditorResponse | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setResponse(null);

    if (!file) {
      setErrorMessage("Please choose a file before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("file", file);

      const res = await fetch("/api/ai-editor", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setResponse(data as EditorResponse);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-zinc-700">
          Editing prompt
        </label>
        <textarea
          id="prompt"
          name="prompt"
          rows={4}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Example: Highlight the strongest moments and suggest what to trim."
          className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          required
        />
      </div>

      <div>
        <label htmlFor="file" className="block text-sm font-medium text-zinc-700">
          Upload essay
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-1.5 block w-full text-sm text-zinc-700 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800"
          required
        />
        <p className="mt-2 text-xs text-zinc-500">
          Supports PDF, DOCX, or TXT files up to 10MB.
        </p>
      </div>

      {errorMessage ? (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {isSubmitting ? "Processing..." : "Analyze"}
      </button>

      {response ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Parsed text preview
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {response.filename} ({response.fileType})
          </p>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700">
            {response.text}
          </pre>
        </div>
      ) : null}
    </form>
  );
}

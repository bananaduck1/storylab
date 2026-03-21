import type { Metadata } from "next";
import { EditorForm } from "./EditorForm";

export const metadata: Metadata = {
  title: "AI Editor",
  description:
    "Upload a draft and get AI-powered editing feedback from StoryLab's essay editor.",
};

export default function EditorPage() {
  return (
    <div className="bg-transparent">
      <div className="mx-auto w-full max-w-4xl bg-paper/92 px-6 py-16 sm:py-20">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
            AI Editor
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
            Upload your draft for a focused edit.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-700">
            Share your prompt and a file. We'll extract the text and prep it for analysis.
          </p>
        </header>

        <section className="mt-10 rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
          <EditorForm />
        </section>
      </div>
    </div>
  );
}

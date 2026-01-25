import type { Metadata } from "next";
import { AiEditorForm } from "./AiEditorForm";

export const metadata: Metadata = {
  title: "AI Editor",
  description:
    "Upload an essay and prompt to get StoryLab's AI editor feedback.",
};

export default function AiEditorPage() {
  const aiEditorEnabled = process.env.AI_EDITOR_ENABLED === "true";

  if (!aiEditorEnabled) {
    return (
      <div className="bg-transparent">
        <div className="mx-auto w-full max-w-6xl bg-paper/92 px-6 py-16 sm:py-20">
          <header className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
              AI Editor
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
              The AI editor is currently offline.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-700">
              We’re finishing a few upgrades before turning this feature back on. Please check back
              soon or{" "}
              <a
                href="/contact"
                className="font-semibold text-zinc-900 underline underline-offset-4"
              >
                contact us
              </a>{" "}
              to learn more.
            </p>
          </header>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl bg-paper/92 px-6 py-16 sm:py-20">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
            AI Editor
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
            Run StoryLab’s AI editor on your essay.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-700">
            Add a prompt for context, upload your draft, and review the structured feedback.
          </p>
        </header>

        <section className="mt-12">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
            <AiEditorForm />
          </div>
        </section>
      </div>
    </div>
  );
}

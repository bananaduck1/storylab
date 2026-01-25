import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Elite humanities training and college applications support—reading, writing, and thinking skills taught by trained humanities graduates.",
};

export default function Home() {
  return (
    <div className="bg-transparent">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
        <Image
          src="/storylab-logo3.png"
          alt="StoryLab"
          width={220}
          height={55}
          className="h-auto w-44 sm:w-52"
          priority
        />
        <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
          Choose your path.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-700">
          Start with the AI editor or explore the StoryLab Academy experience.
        </p>
        <div className="mt-10 flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row">
          <a
            href="/ai-editor"
            className="inline-flex w-full items-center justify-center rounded-full bg-zinc-900 px-8 py-3 text-sm font-semibold text-white shadow-sm shadow-zinc-900/15 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30 sm:w-auto"
          >
            AI Editor
          </a>
          <a
            href="/academy"
            className="inline-flex w-full items-center justify-center rounded-full border border-zinc-300 bg-white px-8 py-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 sm:w-auto"
          >
            Academy
          </a>
        </div>
      </div>
    </div>
  );
}

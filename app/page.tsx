"use client";

import Image from "next/image";
import { TransitionLink } from "../components/PageTransition";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <Image
        src="/storylab-logo3.png"
        alt="StoryLab"
        width={272}
        height={68}
        className="h-auto w-56 sm:w-72"
        priority
      />
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <TransitionLink
          href="/ai-editor"
          className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-8 py-3 text-sm font-medium text-white shadow-sm shadow-zinc-900/15 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
        >
          AI Editor
        </TransitionLink>
        <TransitionLink
          href="/academy"
          className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-8 py-3 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
        >
          Academy
        </TransitionLink>
      </div>
    </div>
  );
}

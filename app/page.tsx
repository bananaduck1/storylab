import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "StoryLab",
  description:
    "Elite humanities training and college applications support.",
};

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center bg-transparent px-6">
      <div className="flex flex-col items-center">
        <Image
          src="/storylab-logo3.png"
          alt="StoryLab"
          width={400}
          height={100}
          className="h-auto w-[280px] sm:w-[360px] md:w-[400px]"
          priority
        />
        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:gap-6">
          <Link
            href="/editor"
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-8 py-3 text-sm font-medium text-white shadow-sm shadow-zinc-900/15 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
          >
            AI Editor
          </Link>
          <Link
            href="/academy"
            className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-8 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
          >
            Academy
          </Link>
        </div>
      </div>
    </div>
  );
}

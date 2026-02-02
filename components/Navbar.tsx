import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-soft/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 min-h-20 py-5">
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/storylab-logo3.png"
            alt="StoryLab"
            width={272}
            height={68}
            className="h-[52px] w-auto flex-shrink-0 md:h-[68px]"
            priority
          />
          <span className="sr-only">Home</span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-6">
          <Link
            href="/editor"
            className="text-sm font-medium text-zinc-700 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
          >
            AI Editor
          </Link>
          <Link
            href="/academy"
            className="text-sm font-medium text-zinc-700 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
          >
            Academy
          </Link>
        </nav>
      </div>
    </header>
  );
}

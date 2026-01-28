"use client";

import Link from "next/link";
import Image from "next/image";
import { TransitionLink } from "./PageTransition";

const academySubLinks: Array<{ href: string; label: string }> = [
  { href: "/services", label: "Programs" },
  { href: "/about", label: "Our Approach" },
  { href: "/team", label: "Our Tutors" },
  { href: "/results", label: "Results" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-soft/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 min-h-20 py-5">
        <TransitionLink href="/" className="inline-flex items-center">
          <Image
            src="/storylab-logo3.png"
            alt="StoryLab"
            width={272}
            height={68}
            className="h-[52px] w-auto flex-shrink-0 md:h-[68px]"
            priority
          />
          <span className="sr-only">Home</span>
        </TransitionLink>

        <div className="hidden items-center gap-6 md:flex">
          <nav aria-label="Primary" className="flex items-center gap-6">
            <TransitionLink
              href="/ai-editor"
              className="text-sm text-zinc-700 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              AI Editor
            </TransitionLink>

            {/* Academy dropdown */}
            <div className="group relative">
              <TransitionLink
                href="/academy"
                className="text-sm text-zinc-700 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
              >
                Academy
              </TransitionLink>
              <div className="pointer-events-none absolute right-0 top-full pt-2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                <div className="min-w-[160px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
                  {academySubLinks.map((l) => (
                    <TransitionLink
                      key={l.href}
                      href={l.href}
                      className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
                    >
                      {l.label}
                    </TransitionLink>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          <TransitionLink
            href="/contact"
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-zinc-900/15 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
          >
            Get started
          </TransitionLink>
        </div>
      </div>

      <nav aria-label="Primary (mobile)" className="border-t border-zinc-200/70 md:hidden">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3">
          <TransitionLink
            href="/ai-editor"
            className="text-sm font-medium text-zinc-900 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
          >
            AI Editor
          </TransitionLink>
          <TransitionLink
            href="/academy"
            className="text-sm font-medium text-zinc-900 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
          >
            Academy
          </TransitionLink>
          {academySubLinks.map((l) => (
            <TransitionLink
              key={l.href}
              href={l.href}
              className="text-sm text-zinc-700 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              {l.label}
            </TransitionLink>
          ))}
        </div>
      </nav>
    </header>
  );
}

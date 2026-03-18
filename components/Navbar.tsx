"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#C0D9CB]/80 bg-[#FAFAF8]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 min-h-20 py-5">
          <Link href="/" className="inline-flex items-center" aria-label="StoryLab home">
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

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 md:flex">
            <nav aria-label="Primary" className="flex items-center gap-6">
              {/* Teachers link */}
              <Link
                href="/teachers"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/30"
                style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
              >
                Teachers
              </Link>

              {/* Academy with hover dropdown */}
              <div className="relative group after:absolute after:content-[''] after:left-0 after:right-0 after:top-full after:h-3">
                <Link
                  href="/teachers/sam-a"
                  className="flex items-center gap-1 text-sm font-medium text-zinc-700 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/30"
                  style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
                >
                  Academy
                  <svg
                    aria-hidden="true"
                    className="mt-px h-3.5 w-3.5 text-zinc-400 transition-transform duration-150 group-hover:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>

                {/* Dropdown panel */}
                <div className="absolute left-1/2 top-full -translate-x-1/2 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                  <div className="w-56 overflow-hidden rounded-xl border border-[#C0D9CB] bg-white shadow-lg">
                    <Link
                      href="/teachers/sam-a/humanities"
                      className="block px-4 py-3 text-sm text-zinc-700 hover:bg-[#DEEEE9] transition-colors"
                    >
                      Humanities Foundations
                    </Link>
                    <Link
                      href="/teachers/sam-a/applications"
                      className="block px-4 py-3 text-sm text-zinc-700 hover:bg-[#DEEEE9] transition-colors border-t border-[#C0D9CB]/50"
                    >
                      College Applications
                    </Link>
                    <Link
                      href="/teachers/sam-a/transfer"
                      className="block px-4 py-3 text-sm text-zinc-700 hover:bg-[#DEEEE9] transition-colors border-t border-[#C0D9CB]/50"
                    >
                      Transfer Applications
                    </Link>
                    <Link
                      href="/teachers/sam-a/pricing"
                      className="block px-4 py-3 text-sm text-zinc-700 hover:bg-[#DEEEE9] transition-colors border-t border-[#C0D9CB]/50"
                    >
                      Pricing
                    </Link>
                  </div>
                </div>
              </div>

              <Link
                href="/blog"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/30"
                style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
              >
                Blog
              </Link>

              {/* Become a teacher CTA */}
              <Link
                href="/teacher/onboarding"
                aria-label="Become a teacher on StoryLab"
                className="inline-flex items-center rounded-[3px] border border-[#2C4A3E] px-4 py-2 text-sm font-medium text-[#2C4A3E] hover:bg-[#2C4A3E] hover:text-white transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/30"
                style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
              >
                Become a teacher
              </Link>
            </nav>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-zinc-700 hover:text-zinc-950 focus:outline-none"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile nav — full-panel */}
      {mobileOpen && (
        <nav
          aria-label="Primary (mobile)"
          className="border-b border-[#C0D9CB] bg-[#FAFAF8] md:hidden z-30"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-4 flex flex-col gap-1">
            <Link
              href="/teachers"
              className="block px-2 py-3 text-sm font-medium text-zinc-900 hover:text-[#2C4A3E] border-b border-[#C0D9CB]/40"
              onClick={() => setMobileOpen(false)}
            >
              Teachers
            </Link>
            <Link
              href="/teachers/sam-a"
              className="block px-2 py-3 text-sm font-medium text-zinc-900 hover:text-[#2C4A3E] border-b border-[#C0D9CB]/40"
              onClick={() => setMobileOpen(false)}
            >
              Academy
            </Link>
            <Link
              href="/blog"
              className="block px-2 py-3 text-sm font-medium text-zinc-900 hover:text-[#2C4A3E] border-b border-[#C0D9CB]/40"
              onClick={() => setMobileOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/teacher/onboarding"
              aria-label="Become a teacher on StoryLab"
              className="mt-2 block rounded-[3px] border border-[#2C4A3E] px-4 py-3 text-sm font-medium text-center text-[#2C4A3E] hover:bg-[#2C4A3E] hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Become a teacher
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}

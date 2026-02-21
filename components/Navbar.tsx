"use client";

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

const programLinks: Array<{ href: string; label: string }> = [
  { href: "/academy/humanities", label: "Humanities Foundations" },
  { href: "/academy/applications", label: "College Applications" },
  { href: "/academy/transfer", label: "Transfer Applications" },
];

const academyLinks: Array<{ href: string; label: string }> = [
  { href: "/academy", label: "Programs" },
  { href: "/team", label: "Our Tutors" },
  { href: "/results", label: "Results" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openDropdown = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setDropdownOpen(true);
  }, []);

  const closeDropdown = useCallback(() => {
    closeTimer.current = setTimeout(() => setDropdownOpen(false), 150);
  }, []);

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

        <div className="hidden items-center gap-6 md:flex">
          <nav aria-label="Primary" className="flex items-center gap-6">
            {/* AI Editor — hidden while in development */}
            {/* <Link
              href="/ai-editor"
              className="text-sm font-medium text-zinc-700 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              AI Editor
            </Link> */}
            {/* Academy dropdown */}
            <div className="relative">
              <Link
                href="/academy"
                className="inline-flex items-center gap-1 text-sm font-medium text-zinc-700 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
                onMouseEnter={openDropdown}
                onMouseLeave={closeDropdown}
                onFocus={openDropdown}
              >
                Academy
              </Link>
              <div
                className={`absolute right-0 top-full pt-2 transition-opacity duration-150 ${
                  dropdownOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onMouseEnter={openDropdown}
                onMouseLeave={closeDropdown}
              >
                <div
                  className="min-w-[220px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
                  onFocus={openDropdown}
                  onBlur={closeDropdown}
                >
                  {/* Programs section with nested items */}
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Programs</p>
                  </div>
                  {programLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="block px-4 py-2 pl-6 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
                    >
                      {l.label}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-zinc-100" />
                  {academyLinks.slice(1).map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link
              href="/lab"
              className="text-sm font-medium text-zinc-700 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              Lab
            </Link>
          </nav>
        </div>
      </div>

      <nav aria-label="Primary (mobile)" className="border-t border-zinc-200/70 md:hidden">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3">
          {/* AI Editor — hidden while in development */}
          {/* <Link
            href="/ai-editor"
            className="text-sm font-medium text-zinc-900 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
          >
            AI Editor
          </Link> */}
          <Link
            href="/academy"
            className="text-sm font-medium text-zinc-900 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
          >
            Academy
          </Link>
          <Link
            href="/lab"
            className="text-sm font-medium text-zinc-900 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
          >
            Lab
          </Link>
          {programLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-zinc-700 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

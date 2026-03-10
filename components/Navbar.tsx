import Link from "next/link";
import Image from "next/image";

const academyLinks: Array<{ href: string; label: string }> = [
  { href: "/academy", label: "Programs" },
  { href: "/team", label: "Our Tutors" },
  { href: "/results", label: "Results" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-soft/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 min-h-20 py-5">
          <Link href="/academy" className="inline-flex items-center">
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

              {/* Academy with hover dropdown */}
              <div className="relative group after:absolute after:content-[''] after:left-0 after:right-0 after:top-full after:h-3">
                <Link
                  href="/academy"
                  className="flex items-center gap-1 text-sm font-medium text-zinc-700 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
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
                  <div className="w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                    <Link
                      href="/academy/humanities"
                      className="block px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      Humanities Foundations
                    </Link>
                    <Link
                      href="/academy/applications"
                      className="block px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors border-t border-zinc-100"
                    >
                      College Applications
                    </Link>
                    <Link
                      href="/academy/transfer"
                      className="block px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors border-t border-zinc-100"
                    >
                      Transfer Applications
                    </Link>
                    <Link
                      href="/academy/pricing"
                      className="block px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors border-t border-zinc-100"
                    >
                      Pricing
                    </Link>
                  </div>
                </div>
              </div>

              <Link
                href="/blog"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
              >
                Blog
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <nav aria-label="Primary (mobile)" className="border-b border-zinc-200/70 bg-soft/90 md:hidden">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-x-5 px-6 py-3">
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
            href="/blog"
            className="text-sm font-medium text-zinc-900 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
          >
            Blog
          </Link>
        </div>
      </nav>
    </>
  );
}

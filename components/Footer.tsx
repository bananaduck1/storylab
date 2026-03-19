import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#2C4A3E]">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <p
              className="text-base font-semibold text-white"
              style={{ fontFamily: "var(--font-cooper, serif)" }}
            >
              StoryLab
            </p>
            <p
              className="mt-2 text-sm text-white/60 leading-relaxed max-w-xs"
              style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
            >
              Infrastructure for human expertise in education.
            </p>
            <div className="mt-6">
              <Link
                href="/teachers"
                className="inline-flex items-center justify-center rounded-[3px] bg-[#DEEEE9] px-5 py-3 text-sm font-medium text-[#1A2E26] hover:bg-white transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                Find a teacher →
              </Link>
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <p
                  className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/50"
                >
                  Platform
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <Link
                      className="text-white/70 hover:text-white transition-colors"
                      href="/teachers"
                    >
                      Teachers
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="text-white/70 hover:text-white transition-colors"
                      href="/teacher/onboarding"
                    >
                      Become a teacher
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p
                  className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/50"
                >
                  Company
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <a
                      href="mailto:storylab.ivy@gmail.com"
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      Contact
                    </a>
                  </li>
                </ul>
                <p
                  className="mt-8 text-xs text-white/40"
                >
                  © {new Date().getFullYear()} StoryLab. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";

const EMAIL_SAM = "mailto:storylab.ivy@gmail.com";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200/70 bg-stone-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <p className="text-sm font-semibold tracking-wide text-zinc-950">
              Ivy StoryLab
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-600">
              Editorial, minimalist coaching for students who want to sound like
              themselves—only clearer.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={EMAIL_SAM}
                className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
              >
                Email Sam
              </a>
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                  Explore
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <Link className="text-zinc-700 hover:text-zinc-950" href="/services">
                      Services
                    </Link>
                  </li>
                  <li>
                    <Link className="text-zinc-700 hover:text-zinc-950" href="/about">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link className="text-zinc-700 hover:text-zinc-950" href="/results">
                      Results
                    </Link>
                  </li>
                  <li>
                    <Link className="text-zinc-700 hover:text-zinc-950" href="/faq">
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link className="text-zinc-700 hover:text-zinc-950" href="/contact">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                  Notes
                </p>
                <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                  Testimonials and outcomes are shown as placeholders until you add
                  your approved language.
                </p>
                <p className="mt-4 text-sm text-zinc-600">
                  <span className="text-zinc-500">© </span>
                  {new Date().getFullYear()} Ivy StoryLab. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


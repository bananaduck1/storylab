import Link from "next/link";
import Image from "next/image";

const EMAIL_SAM = "mailto:storylab.ivy@gmail.com";

const aiEditorEnabled = process.env.AI_EDITOR_ENABLED === "true";

const academyLinks: Array<{ href: string; label: string }> = [
  { href: "/academy", label: "Academy" },
  { href: "/services", label: "Programs" },
  { href: "/about", label: "Our Approach" },
  { href: "/team", label: "Our Tutors" },
  { href: "/results", label: "Results" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const aiEditorLink = { href: "/ai-editor", label: "AI Editor" };

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

        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {aiEditorEnabled ? (
            <Link
              href={aiEditorLink.href}
              className="text-sm font-medium text-zinc-700 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              {aiEditorLink.label}
            </Link>
          ) : null}
          <div className="group relative">
            <button
              type="button"
              aria-haspopup="true"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              Academy
              <span aria-hidden="true" className="text-xs text-zinc-500">
                ▾
              </span>
            </button>
            <div
              role="menu"
              className="invisible absolute left-0 top-full z-20 mt-3 min-w-[220px] rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
            >
              {academyLinks.map((l) => (
                <Link
                  key={l.href}
                  role="menuitem"
                  href={l.href}
                  className="flex w-full items-center rounded-xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus-visible:bg-zinc-100"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-zinc-900/15 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
          >
            Get started
          </a>
        </div>
      </div>

      <nav aria-label="Primary (mobile)" className="border-t border-zinc-200/70 md:hidden">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-4">
          {aiEditorEnabled ? (
            <Link
              href={aiEditorLink.href}
              className="text-sm font-medium text-zinc-700 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              {aiEditorLink.label}
            </Link>
          ) : null}
          <details className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-zinc-700">
              Academy
            </summary>
            <div className="mt-3 flex flex-col gap-2">
              {academyLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm text-zinc-700 hover:text-zinc-950 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-zinc-900/30"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Ivy StoryLab: email Sam directly—gentle, direct, and human.",
};

export default function ContactPage() {
  return (
    <div className="bg-stone-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
            Contact
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
            Let’s keep next steps simple.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-700">
            Email Sam with your timeline, goals, and any questions. Gentle, direct, no pressure.
          </p>
        </header>

        <section className="mt-12">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Email</h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600">
              For inquiries, please share your grade, timeline, and what kind of help you’re
              considering. Email only; no booking link.
            </p>
            <div className="mt-7">
              <a
                href="mailto:storylab.ivy@gmail.com"
                className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
              >
                storylab.ivy@gmail.com
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact StoryLab: reach out to discuss which program fits your student's timeline and goals.",
};

export default function ContactPage() {
  return (
    <div className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl bg-paper/92 px-6 py-16 sm:py-20">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
            Contact
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
            Let's keep next steps simple.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-700">
            Share your student's grade level, timeline, and goals. We'll respond with an honest read
            on which program fits best.
          </p>
        </header>

        <section className="mt-12">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
            <ContactForm />
          </div>
        </section>

        <section className="mt-8 text-center">
          <p className="text-sm text-zinc-600">
            Prefer email?{" "}
            <a
              href="mailto:storylab.ivy@gmail.com"
              className="text-zinc-900 underline underline-offset-4 hover:text-zinc-700"
            >
              storylab.ivy@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

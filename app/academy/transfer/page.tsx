import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Transfer Applications",
  description:
    "For students transferring from one university to a more selective one. We help craft compelling transfer narratives.",
};

export default function TransferPage() {
  return (
    <div className="bg-transparent">
      <div className="mx-auto w-full max-w-6xl bg-paper/92 px-6 py-16 sm:py-20">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-600">
            Academy
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-5xl">
            Transfer Applications
          </h1>
          <p className="mt-2 text-lg font-medium text-zinc-700">
            Current university students
          </p>
          <p className="mt-6 text-lg leading-relaxed text-zinc-700">
            For students transferring from another university to a more selective one. We help
            craft a compelling narrative around your academic journey and growth.
          </p>
        </header>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            What we work on
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Transfer narrative",
                description:
                  "Why you want to transfer and why now. We help you articulate your academic and personal growth.",
              },
              {
                title: "Academic fit",
                description:
                  "How your goals align with the target school. We help you research programs and demonstrate genuine interest.",
              },
              {
                title: "College experience",
                description:
                  "What you've learned and accomplished. We help you present your time at your current school positively.",
              },
              {
                title: "Application strategy",
                description:
                  "School selection and positioning. We help you target schools where you're a strong fit.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6"
              >
                <h3 className="text-lg font-semibold tracking-tight text-zinc-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            The transfer difference
          </h2>
          <div className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-zinc-600">
            <p>
              Transfer applications are different from first-year applications. Admissions
              committees want to understand why you're leaving and why their school is the
              right next step.
            </p>
            <p>
              The key is showing growth and intentionality. What have you learned? How have
              you changed? Why is this the right move for your academic and career goals?
            </p>
            <p>
              We help students tell this story authentically, without being negative about
              their current school or seeming like they're simply seeking prestige.
            </p>
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Ready to start?
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
            We'll discuss your situation, target schools, and timeline to create a plan
            that works for you.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              Get started
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30"
            >
              Back to home
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

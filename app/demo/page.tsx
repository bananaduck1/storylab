import type { Metadata } from "next";
import Link from "next/link";
import { DemoForm } from "./_components/DemoForm";

export const metadata: Metadata = {
  title: "Schedule a Demo — StoryLab",
  description:
    "See how StoryLab gives every student in your school individualized AI coaching in any subject — without hiring more teachers.",
};

export default function DemoPage() {
  return (
    <main className="bg-[#FAFAF8] px-6 py-16 md:py-24 min-h-screen">
      <div className="mx-auto max-w-2xl">
        {/* Back link */}
        <Link
          href="/for-schools"
          className="inline-flex items-center gap-1.5 text-sm text-[#2C4A3E] hover:text-[#3A6054] mb-10 focus:outline-none focus-visible:underline"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          For Schools
        </Link>

        {/* Header */}
        <div className="mb-10">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-4">
            Schedule a Demo
          </p>
          <h1
            className="text-[2rem] leading-[1.2] tracking-tight text-[#1A2E26] mb-4"
            style={{ fontFamily: "var(--font-cooper, serif)" }}
          >
            See StoryLab in 30 minutes.
          </h1>
          <p
            className="text-base leading-relaxed text-[#1A2E26]/70"
            style={{ fontFamily: "var(--font-body, serif)" }}
          >
            We&rsquo;ll walk through how the pilot works, answer your compliance questions,
            and help you decide if StoryLab is right for your students — no commitment required.
          </p>
        </div>

        {/* Form */}
        <DemoForm />

        {/* Trust signals */}
        <div className="mt-10 pt-8 border-t border-[#C0D9CB]">
          <p className="text-xs text-[#1A2E26]/50 leading-relaxed text-center">
            FERPA &amp; COPPA compliant &nbsp;&middot;&nbsp; Student data never sold or used to train AI &nbsp;&middot;&nbsp; Pilot pricing available on request
          </p>
        </div>
      </div>
    </main>
  );
}

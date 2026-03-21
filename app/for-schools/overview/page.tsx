import type { Metadata } from "next";
import Link from "next/link";
import { PrintButton } from "./_components/PrintButton";

export const metadata: Metadata = {
  title: "StoryLab for Schools — Overview",
  description: "One-page overview of StoryLab for school administrators.",
};

export default function OverviewPage() {
  return (
    <main className="min-h-screen bg-white px-8 py-10 max-w-[780px] mx-auto print:px-0 print:py-0">
      {/* Print action — hidden when printing */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link
          href="/for-schools"
          className="text-sm text-[#2C4A3E] hover:underline"
        >
          ← Back to For Schools
        </Link>
        <PrintButton />
      </div>

      {/* Header */}
      <div className="border-b-2 border-[#2C4A3E] pb-6 mb-8">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#2C4A3E]/60 mb-2">
          StoryLab for Schools
        </p>
        <h1
          className="text-[2.2rem] font-bold leading-[1.1] tracking-tight text-[#1A2E26]"
          style={{ fontFamily: "var(--font-cooper, serif)" }}
        >
          Every student deserves a writing coach.
        </h1>
        <p className="mt-3 text-base text-[#1A2E26]/70 max-w-xl" style={{ fontFamily: "var(--font-body, serif)" }}>
          StoryLab is AI-powered writing coaching grounded in your teachers&rsquo; methodology.
          Individualized feedback for every student. No additional headcount.
        </p>
      </div>

      {/* What is StoryLab */}
      <section className="mb-8">
        <h2
          className="text-base font-bold uppercase tracking-[0.1em] text-[#2C4A3E] mb-3"
          style={{ fontFamily: "var(--font-cooper, serif)" }}
        >
          What is StoryLab?
        </h2>
        <p className="text-sm leading-relaxed text-[#1A2E26]/80" style={{ fontFamily: "var(--font-body, serif)" }}>
          StoryLab is a writing coaching platform for schools. Your teachers configure the AI
          coach with their methodology, voice, and standards. Students then receive individualized
          coaching between class periods — structured, on-demand, and grounded in how your
          department actually teaches writing. Teachers review sessions; they don&rsquo;t run them.
        </p>
      </section>

      {/* How it works */}
      <section className="mb-8">
        <h2
          className="text-base font-bold uppercase tracking-[0.1em] text-[#2C4A3E] mb-3"
          style={{ fontFamily: "var(--font-cooper, serif)" }}
        >
          How the Pilot Works
        </h2>
        <div className="space-y-2 text-sm text-[#1A2E26]/80">
          <div className="flex gap-4">
            <span className="w-24 shrink-0 font-medium text-[#1A2E26]/50">Weeks 1–2</span>
            <span>Setup + teacher onboarding (approximately 1 hour)</span>
          </div>
          <div className="flex gap-4">
            <span className="w-24 shrink-0 font-medium text-[#1A2E26]/50">Weeks 3–10</span>
            <span>Up to 30 students access StoryLab with individualized AI coaching</span>
          </div>
          <div className="flex gap-4">
            <span className="w-24 shrink-0 font-medium text-[#1A2E26]/50">Week 10</span>
            <span>Progress report delivered to administrator</span>
          </div>
          <div className="flex gap-4">
            <span className="w-24 shrink-0 font-medium text-[#1A2E26]/50">Week 12</span>
            <span>Decision point: expand to full school, continue pilot, or close</span>
          </div>
        </div>
        <p className="mt-3 text-sm font-medium text-[#2C4A3E]">
          No long-term commitment required. Pilot pricing available on request.
        </p>
      </section>

      {/* FERPA compliance */}
      <section className="mb-8 rounded-[4px] border border-[#C0D9CB] px-5 py-4">
        <h2
          className="text-base font-bold uppercase tracking-[0.1em] text-[#2C4A3E] mb-3"
          style={{ fontFamily: "var(--font-cooper, serif)" }}
        >
          FERPA &amp; COPPA Compliance
        </h2>
        <ul className="space-y-1.5 text-sm text-[#1A2E26]/80">
          {[
            "Student data never sold to third parties",
            "All data encrypted at rest and in transit",
            "Student records never used to train AI models",
            "Full institutional data export available on request",
            "Compliant with FERPA and COPPA requirements",
          ].map((b) => (
            <li key={b} className="flex items-start gap-2">
              <span className="mt-0.5 text-[#2C4A3E]">✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Pilot details */}
      <section className="mb-8">
        <h2
          className="text-base font-bold uppercase tracking-[0.1em] text-[#2C4A3E] mb-3"
          style={{ fontFamily: "var(--font-cooper, serif)" }}
        >
          Pilot Details
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-[#1A2E26]/80">
          <div><span className="font-medium">Students:</span> Up to 30</div>
          <div><span className="font-medium">Duration:</span> 12 weeks</div>
          <div><span className="font-medium">Setup time:</span> ~1 hour</div>
          <div><span className="font-medium">Report:</span> Week 10</div>
          <div><span className="font-medium">Commitment:</span> None required</div>
          <div><span className="font-medium">Pricing:</span> Available on request</div>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-[#C0D9CB] pt-6">
        <h2
          className="text-base font-bold uppercase tracking-[0.1em] text-[#2C4A3E] mb-3"
          style={{ fontFamily: "var(--font-cooper, serif)" }}
        >
          Schedule a Conversation
        </h2>
        <p className="text-sm text-[#1A2E26]/70 mb-3" style={{ fontFamily: "var(--font-body, serif)" }}>
          We&rsquo;re happy to answer compliance questions, walk through the pilot structure, and
          help you determine whether StoryLab is right for your students.
        </p>
        <p className="text-sm font-medium text-[#2C4A3E] print:block hidden">
          storylab.co/demo
        </p>
        <Link
          href="/demo"
          className="print:hidden inline-flex items-center rounded-[3px] bg-[#2C4A3E] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3A6054] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40"
          style={{ fontFamily: "var(--font-cooper, serif)" }}
        >
          Schedule a demo →
        </Link>
      </section>
    </main>
  );
}

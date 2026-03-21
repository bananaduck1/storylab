import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For Schools — StoryLab",
  description:
    "Every student in your district deserves individualized writing coaching. StoryLab makes that possible without hiring 50 more English teachers.",
};

const stats = [
  {
    figure: "70%",
    label: "of 8th graders score below proficient in writing",
    source: "NAEP, 2019",
  },
  {
    figure: "3×",
    label: "less likely to have access to private college counseling",
    source: "First-generation students — Pell Institute",
  },
  {
    figure: "$150–$400/hr",
    label: "cost of private writing and college application coaching",
    source: "National Tutoring Association",
  },
];

const steps = [
  {
    n: "01",
    title: "Pilot enrollment",
    body: "We onboard your teachers in one hour. No IT lift, no new logins for students.",
  },
  {
    n: "02",
    title: "Students access StoryLab",
    body: "Up to 30 students get individualized AI coaching grounded in your teachers' methodology.",
  },
  {
    n: "03",
    title: "You see results",
    body: "At week 10 you receive a progress report. At week 12 you decide whether to expand.",
  },
];

const stakeholders = [
  {
    role: "Principal",
    headline: "Measurable improvement. No additional headcount.",
    body: "StoryLab produces essay improvement data you can show parents and your board. AI handles coaching between sessions — it amplifies your teachers, not replaces them. Cost per student is a fraction of private tutoring.",
  },
  {
    role: "Department Head",
    headline: "Your methodology, scaled to every student.",
    body: "The AI coach is grounded in how your department teaches. Teachers review sessions, they don't run them. No additional workload — just broader reach and coaching continuity between class periods.",
  },
  {
    role: "District Administrator",
    headline: "FERPA compliant. Scalable to 500 students.",
    body: "Deploy to an entire grade without expanding your teacher team. Student data is never sold or used to train AI models. Full compliance documentation available for your IT and legal review.",
  },
];

const complianceBullets = [
  "Student data never sold to third parties",
  "All data encrypted at rest and in transit",
  "Student records never used to train AI models",
  "Full institutional data export available on request",
  "Compliant with FERPA and COPPA requirements",
];

export default function ForSchoolsPage() {
  return (
    <>
      <main>
        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="bg-[#2C4A3E] px-6 py-24 md:py-36 text-center">
          <div className="mx-auto max-w-3xl">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/60 mb-6">
              For Schools &amp; Districts
            </p>
            <h1
              className="text-[clamp(2.2rem,5vw,3.6rem)] font-bold leading-[1.1] tracking-tight text-white mb-6"
              style={{ fontFamily: "var(--font-cooper, serif)" }}
            >
              Every student deserves a writing coach.
            </h1>
            <p
              className="text-lg leading-relaxed text-white/80 mb-10 max-w-2xl mx-auto"
              style={{ fontFamily: "var(--font-body, serif)" }}
            >
              StoryLab makes individualized writing coaching possible for every student in your
              school — without hiring 50 more English teachers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/demo"
                className="inline-flex items-center rounded-[3px] bg-white px-7 py-3.5 text-base font-medium text-[#2C4A3E] hover:bg-[#DEEEE9] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                style={{ fontFamily: "var(--font-cooper, serif)" }}
              >
                Schedule a 30-minute demo →
              </Link>
              <Link
                href="/for-schools/overview"
                className="inline-flex items-center rounded-[3px] border border-white/50 px-7 py-3.5 text-base font-medium text-white hover:border-white hover:bg-white/10 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                style={{ fontFamily: "var(--font-cooper, serif)" }}
              >
                Download overview →
              </Link>
            </div>
          </div>
        </section>

        {/* ── STATS ─────────────────────────────────────────────────────── */}
        <section className="bg-[#FAFAF8] px-6 py-16 md:py-20">
          <div className="mx-auto max-w-[1100px]">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-10 text-center">
              The problem
            </p>
            <div className="grid gap-8 md:grid-cols-3">
              {stats.map((s) => (
                <div key={s.figure} className="text-center">
                  <p
                    className="text-[2.8rem] font-black leading-none tracking-tight text-[#2C4A3E] mb-3"
                    style={{ fontFamily: "var(--font-cooper, serif)" }}
                  >
                    {s.figure}
                  </p>
                  <p className="text-sm leading-snug text-[#1A2E26] mb-2 max-w-[220px] mx-auto">
                    {s.label}
                  </p>
                  <p className="text-xs text-[#1A2E26]/50">{s.source}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
        <section className="bg-[#DEEEE9] px-6 py-16 md:py-24">
          <div className="mx-auto max-w-[880px]">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-5">
              How it works
            </p>
            <h2
              className="text-[2rem] leading-[1.2] tracking-tight text-[#1A2E26] mb-12 max-w-xl"
              style={{ fontFamily: "var(--font-cooper, serif)" }}
            >
              A 12-week pilot. No long-term commitment required.
            </h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n}>
                  <p
                    className="text-[2rem] font-black text-[#2C4A3E]/20 mb-3 leading-none"
                    style={{ fontFamily: "var(--font-cooper, serif)" }}
                  >
                    {s.n}
                  </p>
                  <h3
                    className="text-base font-bold text-[#1A2E26] mb-2"
                    style={{ fontFamily: "var(--font-cooper, serif)" }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed text-[#1A2E26]/70"
                    style={{ fontFamily: "var(--font-body, serif)" }}
                  >
                    {s.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Pilot timeline */}
            <div className="mt-12 rounded-[4px] border border-[#C0D9CB] bg-white/60 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2C4A3E]/70 mb-4">
                Pilot timeline
              </p>
              <div className="space-y-2 text-sm text-[#1A2E26]">
                <div className="flex gap-4">
                  <span className="w-28 shrink-0 text-[#1A2E26]/50">Weeks 1–2</span>
                  <span>Setup + teacher onboarding (1 hour)</span>
                </div>
                <div className="flex gap-4">
                  <span className="w-28 shrink-0 text-[#1A2E26]/50">Weeks 3–10</span>
                  <span>30 students access StoryLab</span>
                </div>
                <div className="flex gap-4">
                  <span className="w-28 shrink-0 text-[#1A2E26]/50">Week 10</span>
                  <span>Progress report delivered to administrator</span>
                </div>
                <div className="flex gap-4">
                  <span className="w-28 shrink-0 text-[#1A2E26]/50">Week 12</span>
                  <span>Decision: expand to full school or close</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STAKEHOLDER SECTIONS ──────────────────────────────────────── */}
        <section className="bg-[#FAFAF8] px-6 py-16 md:py-24">
          <div className="mx-auto max-w-[1100px]">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-5 text-center">
              Built for every stakeholder
            </p>
            <h2
              className="text-[2rem] leading-[1.2] tracking-tight text-[#1A2E26] mb-12 text-center max-w-xl mx-auto"
              style={{ fontFamily: "var(--font-cooper, serif)" }}
            >
              Whoever you are, we have an answer for you.
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {stakeholders.map((s) => (
                <div
                  key={s.role}
                  className="rounded-[4px] border border-[#C0D9CB] bg-white px-6 py-7"
                >
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#2C4A3E]/60 mb-3">
                    {s.role}
                  </p>
                  <h3
                    className="text-base font-bold leading-snug text-[#1A2E26] mb-3"
                    style={{ fontFamily: "var(--font-cooper, serif)" }}
                  >
                    {s.headline}
                  </h3>
                  <p
                    className="text-sm leading-relaxed text-[#1A2E26]/70"
                    style={{ fontFamily: "var(--font-body, serif)" }}
                  >
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FERPA/COPPA COMPLIANCE ─────────────────────────────────────── */}
        <section className="bg-[#2C4A3E] px-6 py-16 md:py-20">
          <div className="mx-auto max-w-[880px]">
            <div className="flex flex-col md:flex-row md:items-start gap-10">
              <div className="md:w-1/2">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/60 mb-4">
                  Compliance
                </p>
                <h2
                  className="text-[1.8rem] leading-[1.2] tracking-tight text-white mb-4"
                  style={{ fontFamily: "var(--font-cooper, serif)" }}
                >
                  Built for IT approval.
                </h2>
                <p
                  className="text-sm leading-relaxed text-white/70"
                  style={{ fontFamily: "var(--font-body, serif)" }}
                >
                  We know the compliance review is often where school partnerships stall.
                  StoryLab is designed to pass your IT and legal review — not just your enthusiasm.
                </p>
              </div>
              <div className="md:w-1/2">
                <ul className="space-y-3">
                  {complianceBullets.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#E8D5B0]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm leading-snug text-white/85">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <section className="bg-[#E8D5B0] px-6 py-16 md:py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2
              className="text-[2rem] leading-[1.2] tracking-tight text-[#1A2E26] mb-4"
              style={{ fontFamily: "var(--font-cooper, serif)" }}
            >
              Ready to see what this looks like for your school?
            </h2>
            <p
              className="text-base leading-relaxed text-[#1A2E26]/70 mb-8 max-w-lg mx-auto"
              style={{ fontFamily: "var(--font-body, serif)" }}
            >
              A 30-minute call. No commitment. We&rsquo;ll walk through the pilot, answer your
              compliance questions, and confirm whether this is the right fit.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/demo"
                className="inline-flex items-center rounded-[3px] bg-[#2C4A3E] px-7 py-3.5 text-base font-medium text-white hover:bg-[#3A6054] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40"
                style={{ fontFamily: "var(--font-cooper, serif)" }}
              >
                Schedule a demo →
              </Link>
              <Link
                href="/for-schools/overview"
                className="inline-flex items-center rounded-[3px] border border-[#2C4A3E] px-7 py-3.5 text-base font-medium text-[#1A2E26] hover:bg-[#2C4A3E] hover:text-white transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40"
                style={{ fontFamily: "var(--font-cooper, serif)" }}
              >
                Download overview →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── MOBILE FLOATING CTA ───────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#2C4A3E] border-t border-white/10 px-4 py-3">
        <Link
          href="/demo"
          className="block w-full rounded-[3px] bg-white py-3 text-center text-sm font-medium text-[#2C4A3E] hover:bg-[#DEEEE9] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          style={{ fontFamily: "var(--font-cooper, serif)" }}
        >
          Schedule a demo →
        </Link>
      </div>
    </>
  );
}

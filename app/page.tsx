import Link from "next/link";
import { TeacherCard } from "@/components/TeacherCard";
import { createStaticClient } from "@/lib/supabase/server";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createStaticClient();
  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, name, slug, subject, photo_url, quote")
    .eq("storefront_published", true)
    .order("created_at", { ascending: true });

  return (
    <main>
      {/* ── 1. HERO ─────────────────────────────────────────────────── */}
      <section className="bg-[#2C4A3E] px-6 py-24 md:py-36 text-center">
        <div className="mx-auto max-w-3xl">
          <h1
            className="text-[clamp(2.4rem,5vw,4rem)] font-bold leading-[1.1] tracking-tight text-white mb-8"
            style={{ fontFamily: "var(--font-cooper, serif)" }}
          >
            AI should amplify teachers, not displace them.
          </h1>
          <p
            className="text-lg leading-relaxed text-white/80 mb-10 max-w-2xl mx-auto"
            style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
          >
            StoryLab is infrastructure for human expertise in education.
          </p>
          <Link
            href="/teachers"
            aria-label="Find a teacher on StoryLab"
            className="inline-flex items-center rounded-[3px] bg-white px-7 py-3.5 text-base font-medium text-[#2C4A3E] hover:bg-[#DEEEE9] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            style={{ fontFamily: "var(--font-cooper, serif)" }}
          >
            Find a teacher →
          </Link>
        </div>
      </section>

      {/* ── 2. STUDENT SECTION ─────────────────────────────────────── */}
      <section className="bg-[#DEEEE9] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[880px]">
          <p
            className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-5"
          >
            For Students
          </p>
          <h2
            className="text-[2rem] leading-[1.2] tracking-tight text-[#2C4A3E] mb-8 max-w-2xl"
            style={{ fontFamily: "var(--font-cooper, serif)" }}
          >
            Great teachers exist. Most students never find them.
          </h2>
          <div
            className="space-y-5 text-base leading-relaxed text-[#1A2E26] max-w-2xl"
            style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
          >
            <p>
              The quality of education you get has always depended on your zip code. The brilliant history teacher, the math coach who finally makes it click, the science mentor who changes how you see the world — their expertise has been invisible to every student outside their classroom.
            </p>
            <p>
              StoryLab connects students with exceptional teachers across every subject. Not AI replacing teachers. Real teachers, amplified.
            </p>
          </div>
          <div className="mt-10">
            <Link
              href="/teachers"
              aria-label="Start learning with a StoryLab teacher"
              className="inline-flex items-center rounded-[3px] bg-[#2C4A3E] px-6 py-3 text-sm font-medium text-white hover:bg-[#3A6054] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40"
              style={{ fontFamily: "var(--font-cooper, serif)" }}
            >
              Start learning →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. TEACHER SECTION ─────────────────────────────────────── */}
      <section className="bg-[#FAFAF8] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[880px]">
          <p
            className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-5"
          >
            For Teachers
          </p>
          <h2
            className="text-[2rem] leading-[1.2] tracking-tight text-[#2C4A3E] mb-8 max-w-2xl"
            style={{ fontFamily: "var(--font-cooper, serif)" }}
          >
            Your methodology is scaled. Your impact is no longer constrained by the number of hours in your day.
          </h2>
          <div
            className="space-y-5 text-base leading-relaxed text-[#1A2E26] max-w-2xl"
            style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
          >
            <p>
              Teaching is among the most skilled, demanding work in the world — and among the worst compensated. Your expertise is worth far more than a single salary, and your impact doesn&rsquo;t have to be limited to the students in the room.
            </p>
            <p>
              StoryLab lets you build a digital presence, reach students globally, and earn what your knowledge is actually worth. Your methodology. Your voice. No longer capped by the hours in your day.
            </p>
          </div>
          <div className="mt-10">
            <Link
              href="/teacher/onboarding"
              aria-label="Become a teacher on StoryLab"
              className="inline-flex items-center rounded-[3px] bg-[#2C4A3E] px-6 py-3 text-sm font-medium text-white hover:bg-[#3A6054] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40"
              style={{ fontFamily: "var(--font-cooper, serif)" }}
            >
              Become a teacher →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3.5 FOR SCHOOLS ──────────────────────────────────────── */}
      <section className="bg-[#DEEEE9] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[880px]">
          <p
            className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-5"
          >
            For Schools
          </p>
          <h2
            className="text-[2rem] leading-[1.2] tracking-tight text-[#2C4A3E] mb-8 max-w-2xl"
            style={{ fontFamily: "var(--font-cooper, serif)" }}
          >
            Extend what your teachers can do.
          </h2>
          <div
            className="space-y-5 text-base leading-relaxed text-[#1A2E26] max-w-2xl"
            style={{ fontFamily: "var(--font-body, serif)" }}
          >
            <p>
              Every student in your school deserves individualized writing coaching. The problem isn&rsquo;t your teachers — it&rsquo;s that there aren&rsquo;t enough hours in their day. StoryLab gives every student coached feedback grounded in your teachers&rsquo; methodology, between class periods, at scale.
            </p>
            <p>
              A 12-week pilot. 30 students. No long-term commitment. We deliver a progress report at week ten.
            </p>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/demo"
              aria-label="Schedule a demo with StoryLab"
              className="inline-flex items-center rounded-[3px] bg-[#2C4A3E] px-6 py-3 text-sm font-medium text-white hover:bg-[#3A6054] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40"
              style={{ fontFamily: "var(--font-cooper, serif)" }}
            >
              Schedule a Demo →
            </Link>
            <Link
              href="/for-schools"
              aria-label="Learn more about StoryLab for schools"
              className="inline-flex items-center rounded-[3px] border border-[#2C4A3E] px-6 py-3 text-sm font-medium text-[#1A2E26] hover:bg-[#2C4A3E] hover:text-white transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40"
              style={{ fontFamily: "var(--font-cooper, serif)" }}
            >
              Learn more →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. PLATFORM MANIFESTO ─────────────────────────────────── */}
      <section className="bg-[#2C4A3E] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[880px]">
          <h2
            className="text-[clamp(1.8rem,3.5vw,2.8rem)] leading-[1.15] tracking-tight text-white mb-8"
            style={{ fontFamily: "var(--font-cooper, serif)" }}
          >
            A brilliant tutor in Flushing is invisible to a family in Seoul.
          </h2>
          <div
            className="space-y-5 text-base leading-relaxed text-white/80 max-w-2xl"
            style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
          >
            <p>
              A college counselor with twenty years of transformative experience retires and takes every insight with them. The self-authorship gap is not randomly distributed — it falls hardest on first-generation students, immigrant families, and students whose cultural backgrounds didn&rsquo;t emphasize personal narrative.
            </p>
            <p>
              StoryLab exists to fix this.
            </p>
          </div>

          {/* Stat strip */}
          <div className="mt-14 pt-8 border-t border-white/20">
            <p
              className="text-[0.85rem] font-medium tracking-widest text-[#E8D5B0] tabular-nums"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              1 teacher &nbsp;&middot;&nbsp; 47 students coached &nbsp;&middot;&nbsp; AI-powered
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. TEACHER GRID ──────────────────────────────────────── */}
      <section className="bg-[#FAFAF8] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[1100px]">
          <p
            className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-5"
          >
            Our Teachers
          </p>
          <h2
            className="text-[2rem] leading-[1.2] tracking-tight text-[#1A2E26] mb-12"
            style={{ fontFamily: "var(--font-cooper, serif)" }}
          >
            Find the right teacher.
          </h2>

          {teachers && teachers.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {teachers.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  name={teacher.name}
                  slug={teacher.slug}
                  subject={teacher.subject}
                  photoUrl={teacher.photo_url}
                  quote={teacher.quote}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[4px] border border-[#C0D9CB] bg-[#DEEEE9] p-10 text-center">
              <p
                className="text-base text-[#1A2E26]/60"
                style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
              >
                Teachers coming soon.
              </p>
            </div>
          )}

          <p
            className="mt-10 text-sm text-[#1A2E26]/50"
            style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
          >
            More teachers coming soon.
          </p>
        </div>
      </section>

      {/* ── 6. PARCHMENT CTA STRIP ───────────────────────────────── */}
      <section className="bg-[#E8D5B0] px-6 py-16">
        <div className="mx-auto max-w-[1100px] flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link
            href="/teachers"
            aria-label="Browse all teachers"
            className="inline-flex items-center rounded-[3px] bg-[#2C4A3E] px-7 py-3.5 text-base font-medium text-white hover:bg-[#3A6054] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40"
            style={{ fontFamily: "var(--font-cooper, serif)" }}
          >
            Browse teachers →
          </Link>
          <Link
            href="/teacher/onboarding"
            aria-label="Become a teacher on StoryLab"
            className="inline-flex items-center rounded-[3px] border border-[#2C4A3E] bg-transparent px-7 py-3.5 text-base font-medium text-[#1A2E26] hover:bg-[#2C4A3E] hover:text-white transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40"
            style={{ fontFamily: "var(--font-cooper, serif)" }}
          >
            Become a teacher →
          </Link>
        </div>
      </section>
    </main>
  );
}

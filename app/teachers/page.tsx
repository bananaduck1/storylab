import type { Metadata } from "next";
import Link from "next/link";
import { createStaticClient } from "@/lib/supabase/server";
import { TeachersGrid } from "./_components/TeachersGrid";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Teachers — StoryLab",
  description:
    "Find the right teacher. StoryLab connects students with exceptional teachers in any subject — their methodology, powered by AI.",
};

export default async function TeachersPage() {
  const supabase = createStaticClient();
  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, name, slug, subject, photo_url, quote")
    .eq("storefront_published", true)
    .order("created_at", { ascending: true });

  return (
    <main>
      {/* Hero */}
      <section className="bg-[#2C4A3E] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#E8D5B0] mb-5">
            Our Teachers
          </p>
          <h1
            className="text-[clamp(2rem,4vw,3rem)] leading-[1.1] tracking-tight text-white max-w-xl"
            style={{ fontFamily: "var(--font-cooper, serif)" }}
          >
            Find the right teacher.
          </h1>
          <p
            className="mt-6 text-base leading-relaxed text-white/70 max-w-lg"
            style={{ fontFamily: "var(--font-body, serif)" }}
          >
            Every teacher on StoryLab has a proven methodology and a personal AI
            agent trained on their coaching style — available to students 24/7.
          </p>
        </div>
      </section>

      {/* Teacher grid with filter */}
      <section className="bg-[#FAFAF8] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[1100px]">
          <TeachersGrid teachers={teachers ?? []} />
          <p
            className="mt-10 text-sm text-[#1A2E26]/50"
            style={{ fontFamily: "var(--font-body, serif)" }}
          >
            More teachers coming soon.
          </p>
        </div>
      </section>

      {/* Become a teacher CTA */}
      <section className="bg-[#DEEEE9] px-6 py-16 md:py-20">
        <div className="mx-auto max-w-[880px] text-center">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-4">
            Join Us
          </p>
          <h2
            className="text-[1.8rem] leading-[1.2] tracking-tight text-[#2C4A3E] mb-6"
            style={{ fontFamily: "var(--font-cooper, serif)" }}
          >
            Interested in teaching on StoryLab?
          </h2>
          <p
            className="text-base leading-relaxed text-[#1A2E26] mb-8 max-w-lg mx-auto"
            style={{ fontFamily: "var(--font-body, serif)" }}
          >
            Deploy your methodology to more students. Your voice, scaled.
          </p>
          <Link
            href="/teacher/onboarding"
            aria-label="Become a teacher on StoryLab"
            className="inline-flex items-center rounded-[3px] bg-[#2C4A3E] px-7 py-3.5 text-base font-medium text-white hover:bg-[#3A6054] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40"
          >
            Become a teacher →
          </Link>
        </div>
      </section>
    </main>
  );
}

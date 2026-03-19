import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createStaticClient } from "@/lib/supabase/server";
import PostGrid from "@/app/blog/_components/PostGrid";
import SubscribeForm from "@/app/blog/_components/SubscribeForm";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createStaticClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("name")
    .eq("slug", slug)
    .eq("storefront_published", true)
    .maybeSingle();

  if (!teacher) return { title: "Not Found" };

  return {
    title: `${teacher.name} — Perspectives`,
    description: `Essays and perspectives from ${teacher.name} on storytelling, the humanities, and the college experience.`,
  };
}

export default async function TeacherBlogPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createStaticClient();

  // Fetch teacher
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("storefront_published", true)
    .maybeSingle();

  if (!teacher) notFound();

  // Fetch posts for this teacher
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, tags, published_at, created_at")
    .eq("published", true)
    .eq("teacher_id", teacher.id)
    .order("published_at", { ascending: false });

  const allTags = [
    ...new Set((posts ?? []).flatMap((p) => p.tags ?? [])),
  ].sort();

  const firstName = teacher.name.split(" ")[0];

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="border-b border-[#C0D9CB] bg-[#2C4A3E] py-20 px-6 text-center">
        <p
          className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#E8D5B0] mb-5"
        >
          {teacher.name}
        </p>
        <h1
          className="text-4xl md:text-5xl text-white leading-tight tracking-tight mb-5"
          style={{ fontFamily: "var(--font-cooper, serif)" }}
        >
          Perspectives
        </h1>
        <p
          className="max-w-md mx-auto text-white/70 leading-relaxed"
          style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
        >
          Essays on storytelling, the humanities, and the college experience — from {firstName}.
        </p>
        <div className="mt-6">
          <Link
            href={`/teachers/${slug}`}
            className="text-sm text-[#E8D5B0]/70 hover:text-[#E8D5B0] transition-colors"
          >
            ← Back to {firstName}&rsquo;s page
          </Link>
        </div>
      </section>

      {/* Posts grid */}
      {posts && posts.length > 0 ? (
        <PostGrid posts={posts} allTags={allTags} />
      ) : (
        <section className="px-6 py-24 text-center">
          <p
            className="text-base text-[#1A2E26]/50"
            style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
          >
            No posts yet. Check back soon.
          </p>
        </section>
      )}

      {/* Subscribe */}
      <section className="border-t border-[#C0D9CB] py-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <p
            className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-4"
          >
            Stay Current
          </p>
          <h2
            className="text-3xl text-[#1A2E26] tracking-tight mb-4"
            style={{ fontFamily: "var(--font-cooper, serif)" }}
          >
            Stay in the conversation.
          </h2>
          <p
            className="text-[#1A2E26]/60 leading-relaxed mb-10"
            style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
          >
            New essays and perspectives delivered to your inbox.
          </p>
          <SubscribeForm />
        </div>
      </section>
    </main>
  );
}

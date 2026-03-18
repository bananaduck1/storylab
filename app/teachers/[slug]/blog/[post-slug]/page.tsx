import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createStaticClient } from "@/lib/supabase/server";
import styles from "@/app/blog/blog.module.css";
import SubscribeForm from "@/app/blog/_components/SubscribeForm";

interface Props {
  params: Promise<{ slug: string; "post-slug": string }>;
}

export async function generateStaticParams() {
  const supabase = createStaticClient();

  // Get all published teachers with their posts
  const { data: teachers } = await supabase
    .from("teachers")
    .select("slug, id")
    .eq("storefront_published", true);

  if (!teachers) return [];

  const params: Array<{ slug: string; "post-slug": string }> = [];

  for (const teacher of teachers) {
    const { data: posts } = await supabase
      .from("posts")
      .select("slug")
      .eq("published", true)
      .eq("teacher_id", teacher.id);

    for (const post of posts ?? []) {
      params.push({ slug: teacher.slug as string, "post-slug": post.slug as string });
    }
  }

  return params;
}

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { "post-slug": postSlug } = await params;
  const supabase = createStaticClient();

  const { data: post } = await supabase
    .from("posts")
    .select("title, excerpt")
    .eq("slug", postSlug)
    .eq("published", true)
    .maybeSingle();

  if (!post) return { title: "Not Found" };

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
  };
}

function formatDate(dateString: string | null) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function TeacherBlogPostPage({ params }: Props) {
  const { slug, "post-slug": postSlug } = await params;
  const supabase = createStaticClient();

  // Verify teacher exists and is published
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("storefront_published", true)
    .maybeSingle();

  if (!teacher) notFound();

  // Fetch the post, verifying it belongs to this teacher
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", postSlug)
    .eq("published", true)
    .eq("teacher_id", teacher.id)
    .maybeSingle();

  if (!post) notFound();

  const date = formatDate(post.published_at);
  const firstName = teacher.name.split(" ")[0];

  return (
    <main className="min-h-screen">
      <article className="max-w-2xl mx-auto px-6 py-16 md:py-24">
        {/* Back link */}
        <Link
          href={`/teachers/${slug}/blog`}
          className="inline-flex items-center gap-2 text-[#1A2E26]/50 text-sm hover:text-[#2C4A3E] transition-colors mb-14"
          style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
        >
          <span aria-hidden="true">←</span> All perspectives from {firstName}
        </Link>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {(post.tags as string[]).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-[#DEEEE9] text-[#2C4A3E] uppercase tracking-wider"
                style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1
          className="text-4xl md:text-5xl text-[#1A2E26] leading-tight tracking-tight mb-6"
          style={{ fontFamily: "var(--font-cooper, serif)" }}
        >
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p
            className="text-xl text-[#1A2E26]/70 leading-relaxed mb-8"
            style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
          >
            {post.excerpt}
          </p>
        )}

        {/* Date + divider */}
        <p
          className="text-sm text-[#1A2E26]/40 pb-12 mb-12 border-b border-[#C0D9CB]"
          style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
        >
          {date ?? ""}
        </p>

        {/* Body */}
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Subscribe */}
        <div className="mt-20 pt-10 border-t border-[#C0D9CB] text-center">
          <p
            className="text-[#1A2E26] font-medium mb-1"
            style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
          >
            Stay in the conversation.
          </p>
          <p
            className="text-[#1A2E26]/50 text-sm mb-6"
            style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
          >
            New essays on storytelling, the humanities, and the college experience.
          </p>
          <SubscribeForm />
        </div>

        {/* Footer nav */}
        <div className="mt-12 pt-10 border-t border-[#C0D9CB]">
          <Link
            href={`/teachers/${slug}/blog`}
            className="inline-flex items-center gap-2 text-[#1A2E26]/50 text-sm hover:text-[#2C4A3E] transition-colors"
            style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
          >
            <span aria-hidden="true">←</span> Back to all perspectives
          </Link>
        </div>
      </article>
    </main>
  );
}

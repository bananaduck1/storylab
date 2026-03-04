import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, createStaticClient } from "@/lib/supabase/server";
import styles from "../blog.module.css";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from("posts")
    .select("slug")
    .eq("published", true);

  return (data ?? []).map((post) => ({ slug: post.slug as string }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("title, excerpt")
    .eq("slug", slug)
    .eq("published", true)
    .single();

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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) notFound();

  const date = formatDate(post.published_at);

  return (
    <main className="min-h-screen">
      <article className="max-w-2xl mx-auto px-6 py-16 md:py-24">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-zinc-500 text-sm hover:text-zinc-900 transition-colors mb-14"
        >
          <span aria-hidden="true">←</span> All perspectives
        </Link>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {(post.tags as string[]).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 uppercase tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-5xl text-zinc-950 leading-tight tracking-tight mb-6">
          {post.title}
        </h1>

        {/* Excerpt / standfirst */}
        {post.excerpt && (
          <p className="text-xl text-zinc-600 leading-relaxed mb-8">
            {post.excerpt}
          </p>
        )}

        {/* Date + divider */}
        <p className="text-sm text-zinc-500 pb-12 mb-12 border-b border-zinc-200">
          {date ?? ""}
        </p>

        {/* Body */}
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Footer nav */}
        <div className="mt-20 pt-10 border-t border-zinc-200">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-zinc-500 text-sm hover:text-zinc-900 transition-colors"
          >
            <span aria-hidden="true">←</span> Back to all perspectives
          </Link>
        </div>
      </article>
    </main>
  );
}

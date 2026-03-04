"use client";

import { useState } from "react";
import Link from "next/link";
import type { Post } from "../types";

function formatDate(dateString: string | null) {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PostCard({ post }: { post: Post }) {
  const date = formatDate(post.published_at);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col bg-white border border-zinc-200 rounded-xl p-7 hover:border-zinc-400 hover:shadow-md transition-all duration-200"
    >
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 uppercase tracking-wider"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <h2 className="text-xl text-zinc-900 font-medium leading-snug mb-3 group-hover:text-zinc-950 transition-colors">
        {post.title}
      </h2>

      {post.excerpt && (
        <p className="text-zinc-600 text-base leading-relaxed mb-4 line-clamp-3 flex-1">
          {post.excerpt}
        </p>
      )}

      {date && (
        <p className="text-sm text-zinc-500 mt-auto">{date}</p>
      )}
    </Link>
  );
}

interface PostGridProps {
  posts: Post[];
  allTags: string[];
}

export default function PostGrid({ posts, allTags }: PostGridProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered =
    activeTag ? posts.filter((p) => p.tags?.includes(activeTag)) : posts;

  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-12">
          <button
            onClick={() => setActiveTag(null)}
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
              activeTag === null
                ? "bg-zinc-900 text-white border-zinc-900"
                : "border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
                activeTag === tag
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-zinc-500 text-center py-16 text-lg">
          No posts yet — check back soon.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}

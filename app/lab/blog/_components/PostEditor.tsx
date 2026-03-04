"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost } from "../actions";
import styles from "@/app/blog/blog.module.css";

export interface PostEditorData {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  tags: string[];
  published: boolean;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

const CONTENT_PLACEHOLDER = `<p>Start writing your post here. Content is stored as HTML.</p>

<h2>Section Heading</h2>

<p>A new paragraph. Wrap text in &lt;p&gt; tags. Use &lt;strong&gt; for <strong>bold</strong> and &lt;em&gt; for <em>italic</em>.</p>

<blockquote>
  <p>Use blockquote for pull quotes or extended citations.</p>
</blockquote>

<h3>Subheading</h3>

<ul>
  <li>Bullet list item</li>
  <li>Another item</li>
</ul>`;

export default function PostEditor({ post }: { post?: PostEditorData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugLocked, setSlugLocked] = useState(!!post);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [tags, setTags] = useState(post?.tags?.join(", ") ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [published, setPublished] = useState(post?.published ?? false);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugLocked) setSlug(slugify(value));
  };

  const handleSave = () => {
    if (!title.trim() || !slug.trim() || !content.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        const tagsArray = tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        const payload = {
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim() || null,
          content: content.trim(),
          tags: tagsArray,
          published,
        };

        if (post?.id) {
          await updatePost(post.id, payload);
        } else {
          await createPost(payload);
        }

        router.push("/lab/blog");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save.");
      }
    });
  };

  const isReady = title.trim() && slug.trim() && content.trim();

  return (
    <div className="flex flex-col h-dvh bg-white">
      {/* ── Toolbar ── */}
      <div className="flex-none flex items-center justify-between border-b border-zinc-200 px-4 py-3 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/lab/blog")}
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            ← Posts
          </button>
          <span className="text-zinc-300 select-none">|</span>
          <span className="text-sm font-medium text-zinc-900">
            {post ? "Edit Post" : "New Post"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile edit/preview tabs */}
          <div className="flex md:hidden border border-zinc-200 rounded-lg overflow-hidden text-xs">
            <button
              onClick={() => setMobileTab("edit")}
              className={`px-3 py-1.5 transition-colors ${
                mobileTab === "edit"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setMobileTab("preview")}
              className={`px-3 py-1.5 transition-colors ${
                mobileTab === "preview"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              Preview
            </button>
          </div>

          {error && <span className="text-xs text-red-600 max-w-48 truncate">{error}</span>}

          <label className="flex items-center gap-1.5 text-sm text-zinc-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 rounded accent-zinc-900"
            />
            Published
          </label>

          <button
            onClick={handleSave}
            disabled={isPending || !isReady}
            className="bg-zinc-900 text-white px-4 py-2 text-sm rounded-lg hover:bg-zinc-800 disabled:opacity-40 transition-colors"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: form fields */}
        <div
          className={`w-full md:w-1/2 md:border-r border-zinc-200 overflow-y-auto flex flex-col gap-5 p-5 ${
            mobileTab === "preview" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title"
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 text-base transition-colors"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
              Slug
              {slugLocked && (
                <button
                  onClick={() => setSlugLocked(false)}
                  className="ml-2 normal-case font-normal text-zinc-400 hover:text-zinc-600"
                >
                  (unlock to edit)
                </button>
              )}
            </label>
            <div className="flex items-center gap-0">
              <span className="px-3 py-2.5 border border-r-0 border-zinc-200 rounded-l-lg text-zinc-400 text-sm bg-zinc-50 whitespace-nowrap">
                /blog/
              </span>
              <input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugLocked(true);
                }}
                placeholder="url-slug"
                className="flex-1 px-3 py-2.5 border border-zinc-200 rounded-r-lg text-zinc-900 font-mono text-sm focus:outline-none focus:border-zinc-400 transition-colors"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
              Excerpt
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="One or two sentence summary shown on the blog index…"
              rows={2}
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 text-base resize-none transition-colors"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
              Tags
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="College Essays, Writing, Humanities"
              className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 text-base transition-colors"
            />
            <p className="text-xs text-zinc-400 mt-1">Comma-separated</p>
          </div>

          {/* Content */}
          <div className="flex flex-col flex-1">
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
              Content{" "}
              <span className="normal-case font-normal text-zinc-400">
                — HTML
              </span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={CONTENT_PLACEHOLDER}
              className="flex-1 min-h-96 w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 font-mono text-sm focus:outline-none focus:border-zinc-400 resize-y transition-colors leading-relaxed"
            />
          </div>
        </div>

        {/* Right: live preview */}
        <div
          className={`w-full md:w-1/2 overflow-y-auto bg-zinc-50 ${
            mobileTab === "edit" ? "hidden md:block" : "block"
          }`}
        >
          <div className="max-w-xl mx-auto px-8 py-10">
            {/* Preview header */}
            <div className="mb-8 pb-8 border-b border-zinc-200">
              {title ? (
                <h1 className="text-3xl text-zinc-900 font-medium leading-tight mb-3">
                  {title}
                </h1>
              ) : (
                <div className="h-9 bg-zinc-200 rounded animate-pulse mb-3" />
              )}
              {excerpt && (
                <p className="text-lg text-zinc-600 leading-relaxed">
                  {excerpt}
                </p>
              )}
              {published && (
                <span className="inline-block mt-3 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                  Published
                </span>
              )}
            </div>

            {content ? (
              <div
                className={styles.content}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <p className="text-zinc-400 italic text-sm">
                Start writing to see your preview here…
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

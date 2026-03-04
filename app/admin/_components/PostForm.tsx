"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost } from "../actions";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  tags: string[] | null;
  published: boolean;
}

interface Props {
  post?: Post;
}

export function PostForm({ post }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [published, setPublished] = useState(post?.published ?? false);

  function autoSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!post) {
      setSlug(autoSlug(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const tagArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    startTransition(async () => {
      const result = post
        ? await updatePost(post.id, { title, slug, excerpt, content, tags: tagArray, published })
        : await createPost({ title, slug, excerpt, content, tags: tagArray, published });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/admin/dashboard");
        router.refresh();
      }
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <form onSubmit={handleSubmit}>
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-base font-semibold text-zinc-900">
            {post ? "Edit post" : "New post"}
          </h1>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded"
              />
              Published
            </label>
            <button
              type="submit"
              disabled={isPending || !title || !slug || !content}
              className="rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        )}

        {/* Meta fields */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Excerpt</label>
            <input
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Tags (comma-separated)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="college essays, storytelling"
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Content (HTML)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={28}
            spellCheck={false}
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm font-mono text-zinc-900 outline-none focus:border-zinc-500 resize-y"
          />
        </div>
      </form>
    </div>
  );
}

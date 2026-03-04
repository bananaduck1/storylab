"use server";

import { createClient } from "@/lib/supabase/server";

interface PostData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  published: boolean;
}

export async function createPost(data: PostData) {
  const supabase = await createClient();

  const { error } = await supabase.from("posts").insert({
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt || null,
    content: data.content,
    tags: data.tags,
    published: data.published,
    published_at: data.published ? new Date().toISOString() : null,
  });

  if (error) return { error: error.message };
}

export async function updatePost(id: string, data: PostData) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("posts")
    .select("published, published_at")
    .eq("id", id)
    .single();

  const published_at =
    data.published && !existing?.published
      ? new Date().toISOString()
      : existing?.published_at ?? null;

  const { error } = await supabase
    .from("posts")
    .update({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      content: data.content,
      tags: data.tags,
      published: data.published,
      published_at,
    })
    .eq("id", id);

  if (error) return { error: error.message };
}

export async function deletePost(id: string) {
  const supabase = await createClient();
  await supabase.from("posts").delete().eq("id", id);
}

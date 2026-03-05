"use server";

import { getSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

interface PostInput {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  tags: string[];
  published: boolean;
}

export async function createPost(data: PostInput): Promise<{ id: string }> {
  const supabase = getSupabase();

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      ...data,
      published_at: data.published ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/blog");
  revalidatePath("/admin/dashboard");

  return post;
}

export async function updatePost(id: string, data: PostInput): Promise<void> {
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("posts")
    .select("published_at")
    .eq("id", id)
    .single();

  let published_at: string | null = existing?.published_at ?? null;
  if (data.published && !published_at) {
    published_at = new Date().toISOString();
  } else if (!data.published) {
    published_at = null;
  }

  const { error } = await supabase
    .from("posts")
    .update({ ...data, published_at })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/blog");
  revalidatePath(`/blog/${data.slug}`);
  revalidatePath("/admin/dashboard");
}

export async function deletePost(id: string, slug: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/dashboard");
}

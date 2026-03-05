import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { PostForm } from "../../../_components/PostForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;

  const { data: post } = await getSupabase()
    .from("posts")
    .select("id, title, slug, excerpt, content, tags, published")
    .eq("id", id)
    .single();

  if (!post) notFound();

  return <PostForm post={post} />;
}

import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import PostEditor from "../../_components/PostEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, content, tags, published")
    .eq("id", id)
    .single();

  if (!post) notFound();

  return (
    <PostEditor
      post={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        tags: post.tags ?? [],
        published: post.published ?? false,
      }}
    />
  );
}

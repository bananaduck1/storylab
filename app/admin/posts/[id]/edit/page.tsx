import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostForm } from "../../../_components/PostForm";
import { DeleteButton } from "../../../_components/DeleteButton";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, content, tags, published")
    .eq("id", id)
    .single();

  if (!post) notFound();

  return (
    <div>
      <PostForm post={post} />
      <div className="max-w-6xl mx-auto px-6 pb-8 flex justify-end">
        <DeleteButton id={post.id} />
      </div>
    </div>
  );
}

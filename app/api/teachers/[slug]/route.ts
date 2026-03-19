import { NextResponse } from "next/server";
import { createStaticClient } from "@/lib/supabase/server";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: Request, { params }: Props) {
  const { slug } = await params;
  const supabase = createStaticClient();

  const { data: teacher, error } = await supabase
    .from("teachers")
    .select("id, name, slug, subject, bio, photo_url, quote, pricing_config")
    .eq("slug", slug)
    .eq("storefront_published", true)
    .maybeSingle();

  if (error || !teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  // Fetch recent posts for this teacher
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, tags, published_at")
    .eq("published", true)
    .eq("teacher_id", teacher.id)
    .order("published_at", { ascending: false })
    .limit(5);

  return NextResponse.json({ teacher, posts: posts ?? [] });
}

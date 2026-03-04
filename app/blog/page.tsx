import type { Metadata } from "next";
import { createStaticClient } from "@/lib/supabase/server";
import PostGrid from "./_components/PostGrid";
import SubscribeForm from "./_components/SubscribeForm";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Perspectives",
  description:
    "Essays on storytelling, the humanities, and the college experience — for students who think in depth.",
};

export default async function BlogPage() {
  const supabase = createStaticClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, tags, published_at, created_at")
    .eq("published", true)
    .order("published_at", { ascending: false });

  const allTags = [
    ...new Set((posts ?? []).flatMap((p) => p.tags ?? [])),
  ].sort();

  return (
    <main className="min-h-screen">
      {/* Editorial hero */}
      <section className="border-b border-zinc-200 py-24 px-6 text-center">
        <p className="text-sm uppercase tracking-widest text-emerald-800 mb-5">
          StoryLab
        </p>
        <h1 className="text-5xl md:text-6xl text-zinc-950 leading-tight tracking-tight mb-5">
          Perspectives
        </h1>
        <p className="max-w-md mx-auto text-zinc-600 leading-relaxed">
          Essays on storytelling, the humanities, and the college experience —
          for students who think in depth.
        </p>
      </section>

      {/* Posts grid with tag filter */}
      <PostGrid posts={posts ?? []} allTags={allTags} />

      {/* Subscribe CTA */}
      <section className="border-t border-zinc-200 py-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-sm uppercase tracking-widest text-emerald-800 mb-4">
            Stay current
          </p>
          <h2 className="text-3xl md:text-4xl text-zinc-950 tracking-tight mb-4">
            Stay in the conversation.
          </h2>
          <p className="text-zinc-600 leading-relaxed mb-10">
            New essays and perspectives delivered to your inbox — no noise, just
            thought.
          </p>
          <SubscribeForm />
        </div>
      </section>
    </main>
  );
}

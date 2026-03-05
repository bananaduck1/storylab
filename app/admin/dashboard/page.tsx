import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import DeleteButton from "../_components/DeleteButton";

export const revalidate = 0;

export default async function AdminDashboard() {
  const { data: posts } = await getSupabase()
    .from("posts")
    .select("id, title, slug, published, published_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-medium text-zinc-900">Posts</h1>
        <Link
          href="/admin/posts/new"
          className="bg-zinc-900 text-white px-4 py-2 text-sm rounded-lg hover:bg-zinc-800 transition-colors"
        >
          + New Post
        </Link>
      </div>

      {!posts?.length ? (
        <div className="text-center py-20 text-zinc-400">
          <p className="mb-4">No posts yet.</p>
          <Link
            href="/admin/posts/new"
            className="text-sm text-zinc-700 underline hover:text-zinc-900"
          >
            Write your first post →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
          {posts.map((post) => {
            const date = new Date(
              post.published_at ?? post.created_at
            ).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={post.id}
                className="flex items-center justify-between px-5 py-4 bg-white hover:bg-zinc-50 transition-colors"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2.5 mb-0.5">
                    <span
                      className={`flex-none text-xs px-2 py-0.5 rounded-full ${
                        post.published
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {post.published ? "Published" : "Draft"}
                    </span>
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {post.title}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-400">
                    /blog/{post.slug} · {date}
                  </p>
                </div>

                <div className="flex-none flex items-center gap-4">
                  {post.published && (
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                      View ↗
                    </Link>
                  )}
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="text-xs text-zinc-600 hover:text-zinc-900 transition-colors"
                  >
                    Edit
                  </Link>
                  <DeleteButton id={post.id} slug={post.slug} title={post.title} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

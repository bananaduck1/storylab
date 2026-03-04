import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, slug, published, published_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-base font-semibold text-zinc-900">Posts</h1>
        <Link
          href="/admin/posts/new"
          className="rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white"
        >
          New post
        </Link>
      </div>

      {!posts?.length ? (
        <p className="text-sm text-zinc-500">No posts yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
              <th className="pb-2 font-medium">Title</th>
              <th className="pb-2 font-medium">Slug</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Created</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-zinc-100">
                <td className="py-3 pr-4 font-medium text-zinc-900 max-w-xs truncate">
                  {post.title}
                </td>
                <td className="py-3 pr-4 text-zinc-500">{post.slug}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      post.published
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {post.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="py-3 pr-4 text-zinc-400 text-xs">
                  {new Date(post.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="py-3 text-right">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

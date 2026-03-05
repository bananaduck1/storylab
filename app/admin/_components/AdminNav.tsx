"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export function AdminNav() {
  const router = useRouter();

  async function signOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3">
      <div className="flex items-center gap-6">
        <span className="text-sm font-semibold text-zinc-900">StoryLab Admin</span>
        <Link
          href="/admin/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Posts
        </Link>
        <Link
          href="/admin/sessions"
          className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Sessions
        </Link>
        <Link
          href="/lab"
          className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Lab
        </Link>
      </div>
      <button
        onClick={signOut}
        className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        Sign out
      </button>
    </header>
  );
}

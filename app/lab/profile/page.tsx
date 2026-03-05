"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSupabase()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) {
          setUser(data.user);
          setDisplayName(data.user.user_metadata?.display_name ?? "");
        }
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    const { error } = await getSupabase().auth.updateUser({
      data: { display_name: displayName },
    });

    if (error) {
      setError(error.message);
    } else {
      setSaved(true);
    }
    setSaving(false);
  }

  return (
    <div className="min-h-dvh bg-white text-zinc-900">
      {/* Top bar */}
      <div className="flex h-10 items-center border-b border-zinc-200 px-4">
        <a
          href="/lab"
          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          ← Lab
        </a>
      </div>

      <div className="mx-auto max-w-md px-6 py-10">
        <h1 className="mb-8 text-sm font-semibold text-zinc-900">Profile</h1>

        {/* Email — read only */}
        <div className="mb-6">
          <p className="mb-1 text-xs text-zinc-500">Email</p>
          <p className="text-sm text-zinc-700">{user?.email ?? "—"}</p>
        </div>

        {/* Member since */}
        <div className="mb-8">
          <p className="mb-1 text-xs text-zinc-500">Member since</p>
          <p className="text-sm text-zinc-700">
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>

        {/* Display name */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">
              Display name
            </label>
            <input
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setSaved(false);
              }}
              placeholder="Your name"
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-zinc-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {saved && <p className="text-xs text-zinc-400">Saved.</p>}
          </div>
        </form>
      </div>
    </div>
  );
}

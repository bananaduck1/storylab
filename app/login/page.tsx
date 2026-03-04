"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="w-full max-w-sm px-4">
        <h1 className="mb-2 text-lg font-semibold tracking-tight text-zinc-900">
          StoryLab
        </h1>
        <p className="mb-8 text-sm text-zinc-500">Sign in with a magic link.</p>

        {submitted ? (
          <div className="rounded border border-zinc-200 bg-zinc-50 px-4 py-4">
            <p className="text-sm text-zinc-700">
              Check <span className="font-medium">{email}</span> for a sign-in link.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoFocus
              required
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {loading ? "…" : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

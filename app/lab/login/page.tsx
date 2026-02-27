"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LabLogin() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }
      router.replace("/lab");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setMessage("Check your email to confirm your account.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-lg font-semibold tracking-tight text-zinc-900">
          StoryLab · Internal
        </h1>
        <div className="mb-4 flex rounded border border-zinc-200 bg-zinc-100 p-0.5">
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(""); setMessage(""); }}
            className={`flex-1 rounded py-1.5 text-sm font-medium transition-colors ${
              mode === "signin" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); setMessage(""); }}
            className={`flex-1 rounded py-1.5 text-sm font-medium transition-colors ${
              mode === "signup" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
            }`}
          >
            Sign up
          </button>
        </div>
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
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          {message && <p className="text-xs text-green-700">{message}</p>}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}

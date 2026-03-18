"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TeacherRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", subject: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Registration failed");
        return;
      }
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">StoryLab</p>
          <h1 className="text-2xl font-semibold text-white mb-2">Set up your teaching account</h1>
          <p className="text-zinc-400 text-sm">You'll be able to add students and build your AI teaching profile from your dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Your name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="First and last name"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">What do you teach?</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. College essay writing, Math, Debate"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !form.name.trim()}
            className="w-full bg-white text-zinc-900 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Setting up…" : "Create my dashboard →"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function JoinOrgPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orgName, setOrgName] = useState<string>("");

  useEffect(() => {
    fetch(`/api/org/${slug}/info`)
      .then(r => r.json())
      .then(d => { if (d.name) setOrgName(d.name); })
      .catch(() => {});
  }, [slug]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org/${slug}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-3xl font-black text-[#1A2E26]" style={{ fontFamily: "var(--font-cooper)" }}>
          Welcome to {orgName || slug}&rsquo;s StoryLab.
        </h1>
        <p className="text-[#1A2E26]/70" style={{ fontFamily: "var(--font-cooper)" }}>
          Your tutors and AI coach are ready for you.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href="/lab"
            className="block w-full bg-[#2C4A3E] text-white py-3 px-6 rounded-[3px] font-medium hover:bg-[#3A6054] transition-colors"
            style={{ fontFamily: "var(--font-cooper)" }}
          >
            Open your AI coach →
          </a>
          <a
            href={`/org/${slug}`}
            className="block w-full border border-[#C0D9CB] text-[#2C4A3E] py-3 px-6 rounded-[3px] font-medium hover:border-[#2C4A3E] transition-colors"
            style={{ fontFamily: "var(--font-cooper)" }}
          >
            Browse your tutors
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full space-y-8">
      <div className="text-center space-y-3">
        <p className="text-sm uppercase tracking-[0.12em] text-[#2C4A3E]/55" style={{ fontFamily: "var(--font-cooper)" }}>
          You&rsquo;ve been invited to join
        </p>
        <h1 className="text-3xl font-black text-[#1A2E26]" style={{ fontFamily: "var(--font-cooper)" }}>
          {orgName || slug}&rsquo;s StoryLab
        </h1>
      </div>

      <form onSubmit={handleJoin} className="space-y-4">
        <div>
          <label htmlFor="invite_code" className="block text-sm text-[#1A2E26]/60 mb-1.5" style={{ fontFamily: "var(--font-cooper)" }}>
            Invite code
          </label>
          <input
            id="invite_code"
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Enter your invite code"
            required
            aria-required="true"
            className="w-full border border-[#C0D9CB] rounded-[4px] px-4 py-3 text-[#1A2E26] bg-white focus:outline-none focus:border-[#2C4A3E] transition-colors"
            style={{ fontFamily: "var(--font-cooper)" }}
          />
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-600" style={{ fontFamily: "var(--font-cooper)" }}>
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !code}
          className="w-full bg-[#2C4A3E] text-white py-3 px-6 rounded-[3px] font-medium hover:bg-[#3A6054] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: "var(--font-cooper)" }}
        >
          {loading ? "Joining\u2026" : `Join ${orgName || slug} \u2192`}
        </button>
      </form>
    </div>
  );
}

"use client";

// Coaching sidebar — polls /api/session/[id]/nudge every 30s with
// the current transcript, displays AI coaching nudges for the teacher.
// Phase 2: upgrade to SSE stream (see TODO-18).

import { useEffect, useRef, useState } from "react";

interface Nudge {
  text: string;
  receivedAt: number;
}

export default function CoachingSidebar({
  sessionId,
  transcript,
}: {
  sessionId: string;
  transcript: string;
}) {
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [loading, setLoading] = useState(false);
  const lastTranscriptRef = useRef<string>("");

  useEffect(() => {
    if (!transcript) return;

    async function fetchNudge() {
      // Only poll if transcript has grown meaningfully since last poll
      const snippet = transcript.slice(-1500);
      if (snippet === lastTranscriptRef.current) return;
      lastTranscriptRef.current = snippet;

      setLoading(true);
      try {
        const res = await fetch(`/api/session/${sessionId}/nudge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript_snippet: snippet }),
        });
        if (!res.ok) return;
        const { nudges: incoming } = await res.json();
        if (incoming?.length) {
          const now = Date.now();
          setNudges((prev) => [
            ...incoming.map((text: string) => ({ text, receivedAt: now })),
            ...prev.slice(0, 9), // keep last 10 total
          ]);
        }
      } catch {
        // Nudge failure is silent
      } finally {
        setLoading(false);
      }
    }

    fetchNudge();
    const interval = setInterval(fetchNudge, 30_000);
    return () => clearInterval(interval);
  }, [sessionId, transcript]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {loading && nudges.length === 0 && (
        <p className="text-xs text-zinc-600">Listening…</p>
      )}

      {!loading && nudges.length === 0 && transcript.length > 100 && (
        <p className="text-xs text-zinc-600">Nothing notable yet.</p>
      )}

      {nudges.map((nudge, i) => (
        <div
          key={nudge.receivedAt + i}
          className={`rounded-lg border p-3 text-sm leading-snug transition-opacity ${
            i === 0
              ? "border-emerald-800 bg-emerald-950/40 text-emerald-200"
              : "border-zinc-800 bg-zinc-800/30 text-zinc-400 opacity-60"
          }`}
        >
          {nudge.text}
        </div>
      ))}

      {transcript.length < 100 && (
        <p className="text-xs text-zinc-700 mt-4">
          Nudges will appear once there&apos;s enough conversation.
        </p>
      )}
    </div>
  );
}

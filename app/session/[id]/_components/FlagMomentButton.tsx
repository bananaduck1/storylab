"use client";

import { useState } from "react";

export default function FlagMomentButton({
  sessionId,
  transcript,
}: {
  sessionId: string;
  transcript: string;
}) {
  const [flagging, setFlagging] = useState(false);
  const [recentlyFlagged, setRecentlyFlagged] = useState(false);

  async function handleFlag() {
    if (flagging || recentlyFlagged) return;

    // Grab the last ~200 chars of transcript as the flagged quote
    const quote = transcript.slice(-200).trim();
    if (!quote) return;

    setFlagging(true);
    try {
      await fetch(`/api/session/${sessionId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote, timestamp_ms: Date.now() }),
      });
      setRecentlyFlagged(true);
      setTimeout(() => setRecentlyFlagged(false), 3000);
    } catch {
      // Non-fatal
    } finally {
      setFlagging(false);
    }
  }

  return (
    <button
      onClick={handleFlag}
      disabled={flagging || !transcript}
      title="Flag this moment as an essay seed"
      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
        recentlyFlagged
          ? "bg-emerald-900 text-emerald-300"
          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-40"
      }`}
    >
      {recentlyFlagged ? "✓ Flagged" : "Flag moment"}
    </button>
  );
}

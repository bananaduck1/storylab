"use client";

import { useState, useTransition } from "react";
import { sendNewsletter } from "../actions";

interface Props {
  postId: string;
  sentAt: string | null;
}

export function SendNewsletterButton({ postId, sentAt }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ sent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (sentAt) {
    const date = new Date(sentAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return (
      <span className="text-xs text-zinc-400">Sent {date}</span>
    );
  }

  if (result) {
    return (
      <span className="text-xs text-emerald-700">
        Sent to {result.sent} {result.sent === 1 ? "subscriber" : "subscribers"}
      </span>
    );
  }

  function handleClick() {
    if (!confirm("Send this post to all email subscribers?")) return;
    setError(null);
    startTransition(async () => {
      try {
        const r = await sendNewsletter(postId);
        setResult(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-500">{error}</span>}
      <button
        onClick={handleClick}
        disabled={isPending}
        className="text-xs text-zinc-600 hover:text-zinc-900 transition-colors disabled:opacity-40"
      >
        {isPending ? "Sending…" : "Send to subscribers"}
      </button>
    </div>
  );
}

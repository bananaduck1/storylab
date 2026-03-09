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

  const alreadySent = sentAt || result;
  const sentLabel = result
    ? `Sent to ${result.sent} subscriber${result.sent === 1 ? "" : "s"}`
    : sentAt
    ? `Sent ${new Date(sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : null;

  function handleClick() {
    const msg = alreadySent
      ? "This was already sent. Send again to all subscribers?"
      : "Send this post to all email subscribers?";
    if (!confirm(msg)) return;
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
      {sentLabel && !isPending && (
        <span className="text-xs text-zinc-400">{sentLabel} ·</span>
      )}
      <button
        onClick={handleClick}
        disabled={isPending}
        className="text-xs text-zinc-600 hover:text-zinc-900 transition-colors disabled:opacity-40"
      >
        {isPending ? "Sending…" : alreadySent ? "Resend" : "Send to subscribers"}
      </button>
    </div>
  );
}

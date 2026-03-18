"use client";

import { useState } from "react";
import type { Portrait } from "@/lib/supabase";

const SESSION_TYPE_LABELS: Record<string, string> = {
  essay_work: "Essay Work",
  generative: "Generative",
  parent_call: "Parent Call",
};

export default function PreSessionBrief({
  sessionId,
  studentName,
  portrait,
  sessionType,
  scheduledAt,
}: {
  sessionId: string;
  studentName: string;
  portrait: Portrait | null;
  sessionType: string;
  scheduledAt: string | null;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const c = portrait?.content_json as any;

  return (
    <div className="border-b border-zinc-800 bg-zinc-900 px-6 py-5">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Pre-Session Brief
              </span>
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                {SESSION_TYPE_LABELS[sessionType] ?? sessionType}
              </span>
              {scheduledAt && (
                <span className="text-xs text-zinc-500">
                  {new Date(scheduledAt).toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>

            <h2 className="text-lg font-semibold text-white">{studentName}</h2>

            {c ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <BriefCard label="Growth edge" value={c.current_growth_edge} />
                <BriefCard label="Next session focus" value={c.next_session_focus} />
                <BriefCard
                  label="Suggested opening"
                  value={buildOpeningQuestion(c)}
                  highlight
                />
              </div>
            ) : (
              <p className="text-sm text-zinc-400">
                No portrait yet — this may be the first session.
              </p>
            )}
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="mt-0.5 shrink-0 text-zinc-500 hover:text-zinc-300 text-sm"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

function BriefCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  if (!value) return null;
  return (
    <div
      className={`rounded-lg border p-3 ${
        highlight
          ? "border-emerald-800 bg-emerald-950/40"
          : "border-zinc-800 bg-zinc-800/40"
      }`}
    >
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="text-sm leading-snug text-zinc-200">{value}</p>
    </div>
  );
}

function buildOpeningQuestion(c: any): string {
  // Derive a suggested opening question from the portrait's next_session_focus.
  // This is a heuristic — good enough for a pre-session prompt.
  const focus: string = c.next_session_focus ?? "";
  if (!focus) return "";
  // Strip any trailing period and turn into a question if it doesn't end with ?
  const cleaned = focus.replace(/\.$/, "");
  if (cleaned.toLowerCase().startsWith("ask") || cleaned.includes("?")) return cleaned;
  return `Open with: "${cleaned}"`;
}

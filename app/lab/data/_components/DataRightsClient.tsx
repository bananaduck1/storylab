"use client";

import { useState } from "react";

interface Conversation {
  id: string;
  title: string;
  essay_mode: string | null;
  created_at: string;
  updated_at: string;
}

interface Profile {
  full_name: string;
  grade: string;
  schools: string | null;
  essay_focus: string | null;
  strengths_notes: string | null;
  growth_notes: string | null;
  recordings_consent: boolean;
  created_at: string;
}

interface Props {
  profile: Profile;
  conversations: Conversation[];
  totalMessages: number;
  userEmail: string;
}

export default function DataRightsClient({
  profile,
  conversations,
  totalMessages,
  userEmail,
}: Props) {
  const [recordingsConsent, setRecordingsConsent] = useState(profile.recordings_consent);
  const [savingConsent, setSavingConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const visibleConversations = conversations.filter((c) => !deletedIds.has(c.id));

  async function toggleRecordingsConsent() {
    setSavingConsent(true);
    setConsentError(null);
    const next = !recordingsConsent;

    try {
      const res = await fetch("/api/lab/data", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordings_consent: next }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setRecordingsConsent(next);
    } catch {
      setConsentError("Couldn't save — please try again.");
    } finally {
      setSavingConsent(false);
    }
  }

  async function deleteConversation(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/lab/conversations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setDeletedIds((prev) => new Set([...prev, id]));
    } catch {
      // Non-fatal — user can retry
    } finally {
      setDeletingId(null);
    }
  }

  const joinedDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="min-h-screen bg-[#f5f0e8] text-[#1a2e26]"
      style={{ fontFamily: "var(--font-cooper)" }}
    >
      {/* Header */}
      <div className="border-b border-[#2C4A3E]/10 bg-[#f5f0e8]">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <a
            href="/lab/profile"
            className="text-xs text-[#2C4A3E]/50 hover:text-[#2C4A3E] transition-colors mb-4 inline-block"
          >
            ← Back to profile
          </a>
          <h1 className="text-2xl font-bold text-[#2C4A3E]">Your StoryLab data</h1>
          <p className="text-sm text-[#2C4A3E]/60 mt-1">{userEmail}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* ── Summary stats card ──────────────────────────────────────────── */}
        <div className="rounded-sm border border-[#2C4A3E]/15 bg-white p-6">
          <h2 className="text-xs uppercase tracking-widest text-[#2C4A3E]/50 mb-4">
            Your activity
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[#2C4A3E]">{visibleConversations.length}</p>
              <p className="text-xs text-[#2C4A3E]/55 mt-1">conversations</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#2C4A3E]">{totalMessages}</p>
              <p className="text-xs text-[#2C4A3E]/55 mt-1">messages</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[#2C4A3E]">{joinedDate}</p>
              <p className="text-xs text-[#2C4A3E]/55 mt-1">joined</p>
            </div>
          </div>
        </div>

        {/* ── Export ──────────────────────────────────────────────────────── */}
        <div className="rounded-sm border border-[#2C4A3E]/15 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-medium text-[#2C4A3E]">Export your data</h2>
              <p className="text-xs text-[#2C4A3E]/55 mt-1 leading-relaxed">
                Download all your conversations, messages, and profile data as JSON.
              </p>
            </div>
            <a
              href="/api/lab/data/export"
              download
              className="shrink-0 rounded-sm border border-[#2C4A3E]/30 bg-[#2C4A3E] px-4 py-2 text-xs font-medium text-[#DEEEE9] hover:bg-[#3a5e50] transition-colors"
            >
              Export all as JSON
            </a>
          </div>
        </div>

        {/* ── Recordings consent ──────────────────────────────────────────── */}
        <div className="rounded-sm border border-[#2C4A3E]/15 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="font-medium text-[#2C4A3E]">Session recordings</h2>
              <p className="text-xs text-[#2C4A3E]/55 mt-1 leading-relaxed">
                Allow your coach to record and use notes from your sessions to
                track your progress over time.{" "}
                {!recordingsConsent && (
                  <span className="text-amber-700">
                    You won&apos;t be able to join new sessions until you re-enable this.
                  </span>
                )}
              </p>
              {consentError && (
                <p className="mt-2 text-xs text-red-600">{consentError}</p>
              )}
            </div>
            <button
              onClick={toggleRecordingsConsent}
              disabled={savingConsent}
              aria-pressed={recordingsConsent}
              aria-label="Toggle session recording consent"
              className={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E] focus-visible:ring-offset-2 disabled:opacity-60 ${
                recordingsConsent ? "bg-[#2C4A3E]" : "bg-[#2C4A3E]/20"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  recordingsConsent ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* ── Coaching notes (student-facing only) ────────────────────────── */}
        {(profile.strengths_notes || profile.growth_notes) && (
          <div className="rounded-sm border border-[#2C4A3E]/15 bg-white p-6">
            <h2 className="text-xs uppercase tracking-widest text-[#2C4A3E]/50 mb-4">
              Coaching notes
            </h2>
            {profile.strengths_notes && (
              <div className="mb-4">
                <p className="text-xs font-medium text-[#2C4A3E]/70 mb-1">Strengths</p>
                <p className="text-sm text-[#2C4A3E]/80 leading-relaxed">
                  {profile.strengths_notes}
                </p>
              </div>
            )}
            {profile.growth_notes && (
              <div>
                <p className="text-xs font-medium text-[#2C4A3E]/70 mb-1">Growth areas</p>
                <p className="text-sm text-[#2C4A3E]/80 leading-relaxed">
                  {profile.growth_notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Conversations ────────────────────────────────────────────────── */}
        <div className="rounded-sm border border-[#2C4A3E]/15 bg-white">
          <div className="px-6 py-4 border-b border-[#2C4A3E]/10">
            <h2 className="text-xs uppercase tracking-widest text-[#2C4A3E]/50">
              Conversations ({visibleConversations.length})
            </h2>
          </div>

          {visibleConversations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-[#2C4A3E]/40">No conversations yet.</p>
            </div>
          ) : (
            <ul>
              {visibleConversations.map((conv, i) => (
                <li
                  key={conv.id}
                  className={`flex items-center justify-between px-6 py-4 gap-4 ${
                    i < visibleConversations.length - 1
                      ? "border-b border-[#2C4A3E]/8"
                      : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#2C4A3E] truncate">
                      {conv.title}
                    </p>
                    <p className="text-xs text-[#2C4A3E]/45 mt-0.5">
                      {new Date(conv.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {conv.essay_mode && (
                        <span className="ml-2 capitalize">{conv.essay_mode.replace("_", " ")}</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteConversation(conv.id)}
                    disabled={deletingId === conv.id}
                    aria-label={`Delete conversation: ${conv.title}`}
                    className="shrink-0 text-xs text-[#2C4A3E]/35 hover:text-red-600 transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E] rounded-sm px-1"
                  >
                    {deletingId === conv.id ? "Deleting…" : "Delete"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer note */}
        <p className="text-xs text-[#2C4A3E]/35 text-center pb-8 leading-relaxed">
          Questions about your data?{" "}
          <a href="mailto:sam@ivystorylab.com" className="underline underline-offset-2">
            sam@ivystorylab.com
          </a>
        </p>
      </div>
    </div>
  );
}

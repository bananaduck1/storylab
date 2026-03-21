"use client";

// ConsentGate — shown to students before the VideoRoom mounts.
//
// Design decisions (from CEO plan 2026-03-21):
// • Full-screen on mobile, centered 400px card on desktop
// • Dark green frosted glass overlay (#2C4A3E at 90% opacity)
// • Warm copy: "Before you join" — not "Terms & Conditions"
// • CTA: "I understand — join session"
// • Error state shows retry button; modal never auto-dismisses on failure
// • Button shows "Joining session…" spinner while POST /consent is in flight

import { useState } from "react";
import VideoRoom from "./VideoRoom";

interface Props {
  sessionId: string;
  roomName: string;
  teacherName: string;
}

export default function ConsentGate({ sessionId, roomName, teacherName }: Props) {
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConsent() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/session/${sessionId}/consent`, {
        method: "POST",
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to save consent");
      }

      setConsented(true);
    } catch (err: any) {
      setError("Unable to save consent — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (consented) {
    return <VideoRoom sessionId={sessionId} roomName={roomName} isTeacher={false} />;
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[#2C4A3E]/90 backdrop-blur-sm p-4">
      {/* Card: full-screen on mobile, 400px centered on desktop */}
      <div className="w-full max-w-sm sm:max-w-[400px] rounded-sm bg-[#1a2e26] border border-[#DEEEE9]/20 p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[#DEEEE9]/60 text-xs uppercase tracking-widest mb-2">
            Before you join
          </p>
          <h2
            className="text-[#DEEEE9] text-xl font-bold leading-snug"
            style={{ fontFamily: "var(--font-cooper)" }}
          >
            Your session with {teacherName}
          </h2>
        </div>

        {/* Body */}
        <div className="space-y-3 text-[#DEEEE9]/75 text-sm leading-relaxed mb-8">
          <p>
            This session may be recorded to help {teacherName} prepare notes and
            track your progress over time.
          </p>
          <p>
            Your writing and session notes are private between you and {teacherName}.
            You can review or delete your data at any time in{" "}
            <a href="/lab/data" className="underline underline-offset-2 text-[#DEEEE9]/90">
              Your StoryLab data
            </a>
            .
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="mb-4 rounded-sm bg-red-900/30 border border-red-700/40 px-3 py-2 text-red-300 text-xs">
            {error}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={handleConsent}
          disabled={submitting}
          className="w-full rounded-sm bg-[#2C4A3E] border border-[#DEEEE9]/30 py-3 text-[#DEEEE9] text-sm font-medium hover:bg-[#3a5e50] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-[#DEEEE9]/60"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Joining session…
            </span>
          ) : (
            "I understand — join session"
          )}
        </button>
      </div>
    </div>
  );
}

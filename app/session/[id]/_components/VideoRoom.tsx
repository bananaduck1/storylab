"use client";

// VideoRoom — in-platform video session using Daily.co.
//
// Transcript strategy: Web Speech API on both teacher AND student browsers.
// Each participant's browser captures their own mic input and streams chunks to
// POST /api/session/[id]/transcript as they speak. The server merges chunks by
// timestamp on session complete into a full labelled dialogue.
//
// Chrome/Edge only — Web Speech API is not available in Safari/Firefox.
// Browsers without support silently skip transcription (session still works).
//
// Phase 2: replace with Deepgram WebSocket for browser-agnostic bidirectional
// transcription. See TODO-21 (Deepgram upgrade) and TODO-22 (Daily.co paid plan).

import { useEffect, useRef, useState, useCallback } from "react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import CoachingSidebar from "./CoachingSidebar";
import FlagMomentButton from "./FlagMomentButton";

export default function VideoRoom({
  sessionId,
  roomName,
  isTeacher,
}: {
  sessionId: string;
  roomName: string;
  isTeacher: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const recognitionRef = useRef<any>(null);
  const sessionStartRef = useRef<number>(Date.now());
  const endedRef = useRef(false);

  const [joined, setJoined] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Local transcript only used for coaching sidebar (teacher) — chunks are persisted server-side
  const [transcript, setTranscript] = useState("");

  // Post a single speech chunk to the server (fire-and-forget, non-fatal)
  const postChunk = useCallback(
    (text: string) => {
      fetch(`/api/session/${sessionId}/transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, timestamp_ms: Date.now() }),
      }).catch(() => {
        // Non-fatal — chunk is lost but session continues
      });
    },
    [sessionId]
  );

  const completeSession = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setCompleting(true);

    const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);

    try {
      await fetch(`/api/session/${sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration_seconds: durationSeconds }),
      });
      setCompleted(true);
    } catch (err) {
      console.error("[VideoRoom] completeSession failed:", err);
    } finally {
      setCompleting(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!containerRef.current) return;

    async function initCall() {
      try {
        // Destroy any lingering Daily.co instance — happens when React Strict Mode
        // double-invokes effects (mount → cleanup → mount) or on fast page navigation.
        const existing = DailyIframe.getCallInstance();
        if (existing) {
          await existing.destroy();
        }

        const tokenRes = await fetch(`/api/session/${sessionId}/token`);
        if (!tokenRes.ok) {
          const j = await tokenRes.json();
          setError(j.error ?? "Failed to get session token");
          return;
        }
        const { token } = await tokenRes.json();

        const call = DailyIframe.createFrame(containerRef.current!, {
          iframeStyle: {
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: "0",
          },
          showLeaveButton: true,
          showFullscreenButton: true,
        });

        callRef.current = call;

        call.on("left-meeting", async () => {
          recognitionRef.current?.stop();
          if (isTeacher) {
            await completeSession();
          }
        });

        call.on("error", (evt: any) => {
          console.error("[VideoRoom] Daily.co error:", evt);
          setError("Video call error — please refresh.");
        });

        await call.join({ url: `https://ivystorylab.daily.co/${roomName}`, token });
        setJoined(true);
        sessionStartRef.current = Date.now();
      } catch (err: any) {
        setError(err?.message ?? "Failed to join session");
      }
    }

    initCall();

    return () => {
      recognitionRef.current?.stop();
      callRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, roomName]);

  // Web Speech API — both teacher and student capture their own mic.
  // Teacher: chunks posted to server + accumulated locally for coaching sidebar.
  // Student: chunks posted to server only.
  useEffect(() => {
    if (!joined) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("[VideoRoom] Web Speech API not available — transcript will be empty");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const chunk = Array.from(event.results as any[])
        .slice(event.resultIndex)
        .filter((r: any) => r.isFinal)
        .map((r: any) => r[0].transcript.trim())
        .join(" ");
      if (chunk) {
        postChunk(chunk);
        // Teacher also maintains local state for coaching sidebar
        if (isTeacher) {
          setTranscript((prev) => (prev ? `${prev} ${chunk}` : chunk));
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "audio-capture") {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onend = () => {
      if (!endedRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn("[VideoRoom] Speech recognition failed to start:", err);
    }

    return () => recognition.stop();
  }, [joined, isTeacher, postChunk]);

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-400 mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center space-y-3">
          <p className="text-zinc-300 text-lg font-medium">Session complete.</p>
          <p className="text-zinc-500 text-sm">
            Portrait update and parent email draft are processing.
          </p>
          <a
            href="/admin/dashboard"
            className="inline-block rounded bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
          >
            Back to dashboard →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Video call iframe */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0"
        style={{ minHeight: "calc(100vh - 200px)" }}
      />

      {/* Teacher-only right panel */}
      {isTeacher && joined && (
        <div className="w-72 shrink-0 flex flex-col border-l border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Coaching
            </span>
            <FlagMomentButton sessionId={sessionId} transcript={transcript} />
          </div>
          <CoachingSidebar sessionId={sessionId} transcript={transcript} />
          {completing && (
            <div className="border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500">
              Processing session…
            </div>
          )}
        </div>
      )}
    </div>
  );
}

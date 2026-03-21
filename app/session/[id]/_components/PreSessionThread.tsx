"use client";

import { useState, useEffect, useRef } from "react";

interface SessionMessage {
  id: string;
  sender_role: "teacher" | "student";
  body: string;
  created_at: string;
}

export default function PreSessionThread({
  sessionId,
  initialMessages,
  teacherName = "your coach",
}: {
  sessionId: string;
  initialMessages: SessionMessage[];
  teacherName?: string;
}) {
  const [messages, setMessages] = useState<SessionMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [cantMakeSent, setCantMakeSent] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(body: string) {
    if (!body.trim() || sending) return;
    setSending(true);
    setSendError("");

    // Optimistic update
    const optimistic: SessionMessage = {
      id: `optimistic-${Date.now()}`,
      sender_role: "student",
      body: body.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    const res = await fetch(`/api/session/${sessionId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim() }),
    });

    setSending(false);

    if (!res.ok) {
      // Revert optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(body.trim());
      setSendError("Couldn't send. Tap to retry.");
      return;
    }

    const saved: SessionMessage = await res.json();
    // Replace optimistic with real
    setMessages((prev) =>
      prev.map((m) => (m.id === optimistic.id ? saved : m))
    );
  }

  async function handleCantMakeIt() {
    if (cantMakeSent) return;
    const sessionInfo = document.title; // fallback
    await sendMessage(
      `Hi ${teacherName}, I won't be able to make our session. Can we reschedule?`
    );
    setCantMakeSent(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="border-b border-zinc-800 bg-zinc-900 px-6 py-5">
      <div className="mx-auto max-w-2xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Message {teacherName}
        </p>

        {/* Thread */}
        <div
          role="log"
          aria-live="polite"
          className="max-h-48 overflow-y-auto space-y-2 pr-1"
        >
          {messages.length === 0 ? (
            <p className="text-sm italic text-zinc-500">
              No messages yet. Leave {teacherName} a note before your session.
            </p>
          ) : (
            messages.map((m) =>
              m.sender_role === "student" ? (
                <div
                  key={m.id}
                  className="border-l-2 border-zinc-300 bg-zinc-100 px-3 py-2 rounded-r text-zinc-900 text-sm"
                >
                  {m.body}
                </div>
              ) : (
                <div
                  key={m.id}
                  className="pl-4 text-zinc-200 text-sm italic"
                  style={{ borderLeft: "none" }}
                >
                  <span className="text-xs text-zinc-500 not-italic mr-2">{teacherName}</span>
                  {m.body}
                </div>
              )
            )
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input row */}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setSendError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={2}
            className="flex-1 resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || sending}
            className="self-end rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            {sending ? "…" : "Send"}
          </button>
        </div>

        {sendError && (
          <p className="text-xs text-red-400">{sendError}</p>
        )}

        {/* Can't make it */}
        {cantMakeSent ? (
          <p className="text-xs text-zinc-500">Message sent ✓</p>
        ) : (
          <button
            onClick={handleCantMakeIt}
            aria-label="Notify teacher you can't make this session"
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Can&apos;t make it? Let {teacherName} know →
          </button>
        )}
      </div>
    </div>
  );
}

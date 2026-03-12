"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm your IvyStoryLab college essay coach. I'm here to help you find your story, develop your voice, and craft essays that feel genuinely like you.\n\nWhat would you like to work on today?",
};

export default function LabPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function signOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await fetch("/api/lab/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history
            .filter((m) => m.id !== "welcome")
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Request failed");
      }

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: accumulated } : m
          )
        );
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    // Auto-grow
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  }

  return (
    <div className="flex flex-col h-dvh bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-zinc-900">IvyStoryLab</span>
          <span className="text-xs text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-full border border-zinc-200">
            Essay Coach
          </span>
        </div>
        <button
          onClick={signOut}
          className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          Sign out
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-xs font-medium">I</span>
                </div>
              )}
              <div
                className={`max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-zinc-900 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm"
                    : "text-zinc-800"
                }`}
              >
                {msg.content}
                {msg.content === "" && loading && (
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-zinc-100 bg-white px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 focus-within:border-zinc-400 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your essay, brainstorm ideas, or share a draft..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 resize-none outline-none leading-relaxed"
              style={{ minHeight: "24px", maxHeight: "160px" }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="shrink-0 w-7 h-7 bg-zinc-900 rounded-xl flex items-center justify-center hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all mb-0.5"
            >
              <svg
                className="w-3.5 h-3.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
                />
              </svg>
            </button>
          </div>
          <p className="text-center text-xs text-zinc-300 mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

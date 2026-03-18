"use client";

import { useState, useRef } from "react";
import Link from "next/link";

type WidgetState = "idle" | "submitting_email" | "loading" | "done" | "error" | "used";

interface AiPreviewWidgetProps {
  teacherSlug: string;
  teacherName: string;
}

export function AiPreviewWidget({ teacherSlug, teacherName }: AiPreviewWidgetProps) {
  const [state, setState] = useState<WidgetState>("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!message.trim()) return;
    setPendingMessage(message.trim());
    setMessage("");
    setState("submitting_email");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setErrorMsg("");
    setState("loading");

    try {
      const res = await fetch("/api/lab/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: pendingMessage,
          email,
          teacherSlug,
        }),
      });

      if (res.status === 429) {
        setState("used");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "already_used") {
          setState("used");
        } else {
          setErrorMsg("Something went wrong — try again.");
          setState("error");
        }
        return;
      }

      // Stream the response
      const reader = res.body?.getReader();
      if (!reader) {
        setState("error");
        setErrorMsg("Something went wrong — try again.");
        return;
      }

      const decoder = new TextDecoder();
      let fullText = "";
      setState("done");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setAiResponse(fullText);
      }
    } catch {
      setErrorMsg("Something went wrong — try again.");
      setState("error");
    }
  };

  const firstName = teacherName.split(" ")[0];

  return (
    <section
      id="preview"
      className="mx-auto max-w-2xl w-full"
      aria-label={`Try ${teacherName}'s AI coach free`}
    >
      <div className="rounded-[4px] border border-[#C0D9CB] bg-[#FAFAF8] overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-[#C0D9CB]">
          <p
            className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E] mb-3"
            style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
          >
            Try {firstName}&rsquo;s AI Coach — Free
          </p>
          <p
            className="text-base leading-relaxed text-[#1A2E26]"
            style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
          >
            Ask anything about your college essay.
          </p>
        </div>

        <div className="px-8 py-6">
          {/* Idle / Input state */}
          {(state === "idle" || state === "error") && (
            <div>
              <label htmlFor="preview-message" className="sr-only">
                Ask {firstName} a question about your college essay
              </label>
              <textarea
                ref={textareaRef}
                id="preview-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`What should I write about? I'm first-gen, applying to Stanford...`}
                rows={4}
                aria-label={`Ask ${firstName} a question about your college essay`}
                className="w-full resize-none rounded-[4px] border border-[#C0D9CB] bg-white px-4 py-3 text-base leading-relaxed text-[#1A2E26] placeholder-[#1A2E26]/40 focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/30 transition"
                style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
                }}
              />
              {state === "error" && errorMsg && (
                <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  aria-label={`Send your question to ${firstName}`}
                  className="inline-flex items-center rounded-[3px] bg-[#2C4A3E] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3A6054] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40"
                  style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
                >
                  Send →
                </button>
              </div>
            </div>
          )}

          {/* Email gate */}
          {state === "submitting_email" && (
            <div>
              {/* Show pending message */}
              <div className="mb-6 flex justify-end">
                <div
                  className="max-w-sm rounded-[4px] bg-[#E8D5B0] px-5 py-3 text-base leading-relaxed text-[#1A2E26]"
                  style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
                >
                  {pendingMessage}
                </div>
              </div>

              <p
                className="mb-4 text-base text-[#1A2E26]"
                style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
              >
                One more step — where do we send your session notes?
              </p>
              <form onSubmit={handleEmailSubmit} className="flex gap-3">
                <div className="flex-1">
                  <label htmlFor="preview-email" className="sr-only">
                    Your email address
                  </label>
                  <input
                    id="preview-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    autoFocus
                    required
                    aria-label="Your email address"
                    className="w-full rounded-[4px] border border-[#C0D9CB] bg-white px-4 py-2.5 text-base text-[#1A2E26] placeholder-[#1A2E26]/40 focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/30 transition"
                    style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
                  />
                  {errorMsg && (
                    <p className="mt-1 text-sm text-red-600">{errorMsg}</p>
                  )}
                </div>
                <button
                  type="submit"
                  aria-label="Submit your email and get your response"
                  className="inline-flex items-center rounded-[3px] bg-[#2C4A3E] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3A6054] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40"
                  style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
                >
                  Go →
                </button>
              </form>
            </div>
          )}

          {/* Loading */}
          {state === "loading" && (
            <div>
              {/* Show user message */}
              <div className="mb-6 flex justify-end">
                <div
                  className="max-w-sm rounded-[4px] bg-[#E8D5B0] px-5 py-3 text-base leading-relaxed text-[#1A2E26]"
                  style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
                >
                  {pendingMessage}
                </div>
              </div>
              <div className="flex items-center gap-3 py-4">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#2C4A3E] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-[#2C4A3E] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-[#2C4A3E] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <p
                  className="text-sm text-[#1A2E26]/60"
                  style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
                >
                  {firstName} is reading your question&hellip;
                </p>
              </div>
            </div>
          )}

          {/* Done — response shown */}
          {state === "done" && (
            <div>
              {/* User message */}
              <div className="mb-8 flex justify-end">
                <div
                  className="max-w-sm rounded-[4px] bg-[#E8D5B0] px-5 py-3 text-base leading-relaxed text-[#1A2E26]"
                  style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
                >
                  {pendingMessage}
                </div>
              </div>

              {/* AI response — letter-exchange feel */}
              <div className="mb-8">
                <p
                  className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#2C4A3E]/70 mb-3"
                  style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
                >
                  {firstName}&rsquo;s response
                </p>
                <div
                  className="text-base leading-relaxed text-[#1A2E26] whitespace-pre-wrap"
                  style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
                >
                  {aiResponse}
                </div>
              </div>

              {/* CTA to continue */}
              <div className="pt-6 border-t border-[#C0D9CB]">
                <p
                  className="text-base text-[#1A2E26] mb-4"
                  style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
                >
                  Want to continue this conversation?
                </p>
                <Link
                  href="/lab"
                  aria-label={`Start coaching with ${firstName}`}
                  className="inline-flex items-center rounded-[3px] bg-[#2C4A3E] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3A6054] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4A3E]/40"
                  style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
                >
                  Start coaching with {firstName} →
                </Link>
              </div>
            </div>
          )}

          {/* Used state */}
          {state === "used" && (
            <div className="py-4">
              <p
                className="text-base text-[#1A2E26] mb-4"
                style={{ fontFamily: "var(--font-body, 'Literata', serif)" }}
              >
                You&rsquo;ve used your free message.
              </p>
              <Link
                href="/lab"
                aria-label="Sign up to continue coaching"
                className="inline-flex items-center rounded-[3px] bg-[#2C4A3E] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3A6054] transition-colors duration-150"
                style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
              >
                Sign up to continue →
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

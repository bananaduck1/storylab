"use client";

import { useState, useRef, useCallback, useEffect, type FormEvent, type DragEvent, type KeyboardEvent } from "react";

/* ── constants ── */
const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPT = ".txt,.pdf,.docx";
const ACCEPTED_TYPES = new Set([
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ACCEPTED_EXTS = /\.(txt|pdf|docx)$/i;
function isAcceptedFile(f: File) {
  return ACCEPTED_TYPES.has(f.type) || ACCEPTED_EXTS.test(f.name);
}

const RUBRIC_LABELS: Record<string, string> = {
  R001: "The turning point",
  R002: "Stakes & risk",
  R003: "Insight over achievement",
  R004: "Specificity & detail",
  R005: "Voice & restraint",
  R006: "Narrative flow",
  R007: "Vulnerability & boundaries",
  R008: "Tone & control",
};

const TIER_OPTIONS = [
  { value: "free", label: "Free", desc: "Diagnosis + next steps" },
  { value: "pro", label: "Pro", desc: "Conversational coaching" },
] as const;

type Tier = "free" | "pro";

const FREE_USAGE_KEY = "storylab_free_uses";
const FREE_USAGE_LIMIT = 3;

/* ── report types (Free) ── */
type EvidenceSpan = { quote: string; why_it_matters: string };
type RubricScore = {
  rubric_id: string;
  score: number;
  evidence_spans: EvidenceSpan[];
  notes: string;
};
type WhatHappensNext = {
  direction_a: string;
  direction_b: string;
  why_dialogue_needed: string;
  gate_question: string;
};
type ReportResult = {
  analysis: {
    rubric_scores: RubricScore[];
    weakest_dimensions: string[];
    dominant_misconception: {
      misconception_id: string;
      confidence: number;
      evidence_spans: EvidenceSpan[];
      why_this_matters: string;
    };
    recommended_intervention: {
      intervention_id: string;
      rationale: string;
      effort_level: string;
      output_format: string;
    };
  };
  student_output: {
    headline: string;
    what_to_fix_first: string;
    brief_explanation: string;
    concept_taught: string;
    what_happens_next: WhatHappensNext;
  };
};

/* ── pro chat types ── */
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
type CoachState = {
  last_question_asked: string;
  last_user_answer: string;
  current_focus: string;
};
type ProChatResult = {
  mode: "chat";
  coach_message_markdown: string;
  questions: string[];
  suggested_next_actions: string[];
  coach_state?: CoachState;
};

/* ── progress bar hook ── */
function useAnalysisProgress(active: boolean) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const wasActive = useRef(false);

  useEffect(() => {
    if (active) {
      wasActive.current = true;
      setProgress(0);
      let p = 0;
      intervalRef.current = setInterval(() => {
        // Fast to ~60%, slows down, asymptotically approaches 92%
        if (p < 60) p += 3 + Math.random() * 2;
        else if (p < 80) p += 0.8 + Math.random() * 0.5;
        else if (p < 92) p += 0.2 + Math.random() * 0.2;
        else p = Math.min(p + 0.05, 92);
        setProgress(Math.min(p, 92));
      }, 300);
    } else if (wasActive.current) {
      // Was active, now complete - jump to 100%
      clearInterval(intervalRef.current);
      setProgress(100);
      const t = setTimeout(() => {
        setProgress(0);
        wasActive.current = false;
      }, 500);
      return () => clearTimeout(t);
    }
    return () => clearInterval(intervalRef.current);
  }, [active]);

  return progress;
}

/* ── score helpers ── */
function scoreColor(s: number) {
  if (s <= 2) return "bg-red-400";
  if (s === 3) return "bg-amber-400";
  return "bg-emerald-500";
}
function scoreLabel(s: number) {
  if (s <= 2) return "Needs work";
  if (s === 3) return "Developing";
  if (s === 4) return "Strong";
  return "Excellent";
}

/* ══════════════════════════════════════════
   Report view (Free tier)
   ══════════════════════════════════════════ */
function AnalysisReport({
  data,
  onStartChat,
  chatInput,
  setChatInput,
  loading,
}: {
  data: ReportResult;
  onStartChat: (msg: string) => void;
  chatInput: string;
  setChatInput: (v: string) => void;
  loading: boolean;
}) {
  const { analysis, student_output: so } = data;
  const whn = so.what_happens_next;

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (chatInput.trim()) onStartChat(chatInput.trim());
    }
  }

  return (
    <div className="mt-10 space-y-10">
      {/* Headline */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
          {so.headline}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-zinc-700">
          {so.brief_explanation}
        </p>
      </section>

      {/* Concept taught */}
      {so.concept_taught && (
        <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Concept to learn
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-800">
            {so.concept_taught}
          </p>
        </section>
      )}

      {/* What to fix first */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          What to fix first
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-800">
          {so.what_to_fix_first}
        </p>
      </section>

      {/* Rubric scores */}
      <section>
        <h3 className="text-lg font-semibold tracking-tight text-zinc-950">
          Rubric scores
        </h3>
        <div className="mt-4 space-y-4">
          {analysis.rubric_scores.map((rs) => (
            <div key={rs.rubric_id}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-900">
                  {RUBRIC_LABELS[rs.rubric_id] ?? rs.rubric_id}
                </span>
                <span className="text-xs text-zinc-500">
                  {rs.score}/5 — {scoreLabel(rs.score)}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-zinc-100">
                <div
                  className={`h-2 rounded-full transition-all ${scoreColor(rs.score)}`}
                  style={{ width: `${(rs.score / 5) * 100}%` }}
                />
              </div>
              {rs.notes && (
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                  {rs.notes}
                </p>
              )}
              {rs.evidence_spans.length > 0 && (
                <div className="mt-2 space-y-2">
                  {rs.evidence_spans.map((ev, i) => (
                    <blockquote
                      key={i}
                      className="border-l-2 border-zinc-200 pl-3 text-xs leading-relaxed"
                    >
                      <p className="italic text-zinc-700">&ldquo;{ev.quote}&rdquo;</p>
                      <p className="mt-0.5 text-zinc-500">{ev.why_it_matters}</p>
                    </blockquote>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Key insight */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Key insight
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-800">
          {analysis.dominant_misconception.why_this_matters}
        </p>
        {analysis.dominant_misconception.evidence_spans.length > 0 && (
          <div className="mt-3 space-y-2">
            {analysis.dominant_misconception.evidence_spans.map((ev, i) => (
              <blockquote
                key={i}
                className="border-l-2 border-zinc-200 pl-3 text-xs leading-relaxed"
              >
                <p className="italic text-zinc-700">&ldquo;{ev.quote}&rdquo;</p>
                <p className="mt-0.5 text-zinc-500">{ev.why_it_matters}</p>
              </blockquote>
            ))}
          </div>
        )}
      </section>

      {/* ═══ WHAT HAPPENS NEXT — THE WALL ═══ */}
      <section className="rounded-2xl border-2 border-zinc-900 bg-zinc-900 p-8 text-white">
        <h3 className="text-lg font-semibold tracking-tight">
          What happens next
        </h3>

        {/* Two directions */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white/10 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
              One direction
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-zinc-100">
              {whn.direction_a}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
              Another direction
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-zinc-100">
              {whn.direction_b}
            </p>
          </div>
        </div>

        {/* Why dialogue needed */}
        <p className="mt-6 text-sm leading-relaxed text-zinc-300">
          {whn.why_dialogue_needed}
        </p>

        {/* Gate question */}
        <div className="mt-6 rounded-xl bg-white/5 border border-white/10 p-5">
          <p className="text-base font-medium text-white leading-relaxed">
            &ldquo;{whn.gate_question}&rdquo;
          </p>
        </div>

        {/* In-place chat input */}
        <div className="mt-6">
          <label className="block text-xs font-medium text-zinc-400 mb-2">
            Answer the question to continue
          </label>
          <div className="flex gap-2 items-end">
            <textarea
              rows={2}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer here…"
              className="flex-1 resize-none rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/40"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => chatInput.trim() && onStartChat(chatInput.trim())}
              disabled={loading || !chatInput.trim()}
              className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 transition-colors"
            >
              {loading ? "Starting…" : "Start coaching"}
            </button>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Pro tier unlocked — your first coaching session is free
          </p>
        </div>
      </section>
    </div>
  );
}

/* ══════════════════════════════════════════
   Simple markdown renderer (no deps)
   ══════════════════════════════════════════ */
function renderMarkdownLine(line: string, idx: number) {
  // Bold
  const parts = line.split(/(\*\*[^*]+\*\*)/g).map((seg, i) => {
    if (seg.startsWith("**") && seg.endsWith("**")) {
      return <strong key={i}>{seg.slice(2, -2)}</strong>;
    }
    // Italic
    const italicParts = seg.split(/(\*[^*]+\*)/g).map((s2, j) => {
      if (s2.startsWith("*") && s2.endsWith("*")) {
        return <em key={j}>{s2.slice(1, -1)}</em>;
      }
      return s2;
    });
    return <span key={i}>{italicParts}</span>;
  });
  return <p key={idx} className="text-sm leading-relaxed text-zinc-800">{parts}</p>;
}

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("### ")) {
          return <h4 key={i} className="text-sm font-semibold text-zinc-900 mt-4">{trimmed.slice(4)}</h4>;
        }
        if (trimmed.startsWith("## ")) {
          return <h3 key={i} className="text-base font-semibold text-zinc-950 mt-4">{trimmed.slice(3)}</h3>;
        }
        if (trimmed.startsWith("# ")) {
          return <h2 key={i} className="text-lg font-semibold text-zinc-950 mt-4">{trimmed.slice(2)}</h2>;
        }
        if (trimmed.startsWith("> ")) {
          return (
            <blockquote key={i} className="border-l-2 border-zinc-300 pl-3 text-sm italic text-zinc-600">
              {trimmed.slice(2)}
            </blockquote>
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          return (
            <div key={i} className="flex gap-2 text-sm text-zinc-800">
              <span className="text-zinc-400 shrink-0">•</span>
              <span>{trimmed.slice(2)}</span>
            </div>
          );
        }
        return renderMarkdownLine(trimmed, i);
      })}
    </div>
  );
}

/* ══════════════════════════════════════════
   Streaming text component (typewriter effect)
   ══════════════════════════════════════════ */
function StreamingText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayedText("");
    setIsComplete(false);

    // Stream words with natural pacing
    const words = text.split(/(\s+)/); // Keep whitespace
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        // Add 1-3 words at a time for natural flow
        const wordsToAdd = Math.min(1 + Math.floor(Math.random() * 2), words.length - currentIndex);
        const newWords = words.slice(currentIndex, currentIndex + wordsToAdd).join("");
        setDisplayedText(prev => prev + newWords);
        currentIndex += wordsToAdd;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, 30 + Math.random() * 20); // 30-50ms per batch

    return () => clearInterval(interval);
  }, [text, onComplete]);

  return <SimpleMarkdown text={isComplete ? text : displayedText} />;
}

/* ══════════════════════════════════════════
   Pro chat view
   ══════════════════════════════════════════ */
function ProChatView({
  messages,
  loading,
  onSend,
  suggestedActions,
}: {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (msg: string) => void;
  suggestedActions: string[];
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Track which message is currently streaming
  const [streamingIndex, setStreamingIndex] = useState<number | null>(null);
  const prevMessagesLength = useRef(messages.length);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, streamingIndex]);

  // Detect when a new assistant message arrives and start streaming it
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      const newMsg = messages[messages.length - 1];
      if (newMsg.role === "assistant") {
        setStreamingIndex(messages.length - 1);
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    onSend(text);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleStreamComplete() {
    setStreamingIndex(null);
  }

  return (
    <div
      className="mt-8 flex flex-col rounded-2xl border border-zinc-200 bg-zinc-50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{ minHeight: "420px" }}
    >
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ maxHeight: "60vh" }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            style={{ animationDelay: `${Math.min(i * 50, 200)}ms` }}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-zinc-900 text-white"
                  : "bg-white border border-zinc-200 text-zinc-800"
              }`}
            >
              {msg.role === "assistant" ? (
                streamingIndex === i ? (
                  <StreamingText text={msg.content} onComplete={handleStreamComplete} />
                ) : (
                  <SimpleMarkdown text={msg.content} />
                )
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white border border-zinc-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-500 animate-pulse" />
                <span className="h-2 w-2 rounded-full bg-zinc-500 animate-pulse" style={{ animationDelay: "0.2s" }} />
                <span className="h-2 w-2 rounded-full bg-zinc-500 animate-pulse" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested actions */}
      {suggestedActions.length > 0 && !loading && streamingIndex === null && (
        <div className="px-5 pb-2 flex flex-wrap gap-2 animate-in fade-in duration-300">
          {suggestedActions.map((action, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSend(action)}
              className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-zinc-200 bg-white p-3 flex gap-2 items-end">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up question…"
          className="flex-1 resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          disabled={loading}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="shrink-0 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Page
   ══════════════════════════════════════════ */
export default function AiEditorPage() {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [tier, setTier] = useState<Tier>("free");
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Pro chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatSuggestedActions, setChatSuggestedActions] = useState<string[]>([]);
  const [chatStarted, setChatStarted] = useState(false);
  const [essayText, setEssayText] = useState(""); // cached for pro follow-ups
  const [coachState, setCoachState] = useState<CoachState | null>(null);

  // Track if we're doing initial analysis (for progress bar)
  const [isInitialAnalysis, setIsInitialAnalysis] = useState(false);

  // Handoff chat input (for Free → Pro transition)
  const [handoffChatInput, setHandoffChatInput] = useState("");

  // Report collapsed state (for showing summary above chat)
  const [reportCollapsed, setReportCollapsed] = useState(false);

  const handleFile = useCallback((f: File | null) => {
    if (!f) return;
    if (!isAcceptedFile(f)) {
      setError("Unsupported file type. Please upload a .txt, .pdf, or .docx file.");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("File exceeds the 10 MB limit.");
      return;
    }
    setError(null);
    setFile(f);
  }, []);

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  }
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
  }
  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
  }

  function resetResults() {
    setReportResult(null);
    setChatMessages([]);
    setChatSuggestedActions([]);
    setChatStarted(false);
    setEssayText("");
    setCoachState(null);
    setIsInitialAnalysis(false);
    setReportCollapsed(false);
    setError(null);
  }

  // ── Free / Plus: report mode submit ──
  async function handleReportSubmit(e: FormEvent) {
    e.preventDefault();
    resetResults();

    if (!file) {
      setError("Please select a file.");
      return;
    }

    const body = new FormData();
    if (prompt.trim()) body.append("prompt", prompt.trim());
    body.append("file", file);
    body.append("tier", tier);

    setIsInitialAnalysis(true);
    setLoading(true);
    try {
      const res = await fetch("/api/test-analysis", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? `Server error ${res.status}`);
      } else {
        setReportResult(json as ReportResult);
      }
    } catch {
      setError("Network error — could not reach server.");
    } finally {
      setLoading(false);
      // Reset after a brief delay to allow progress bar completion animation
      setTimeout(() => setIsInitialAnalysis(false), 600);
    }
  }

  // ── Pro: extract text then start chat ──
  async function handleProStart(e: FormEvent) {
    e.preventDefault();
    resetResults();

    if (!file) {
      setError("Please select a file.");
      return;
    }

    setIsInitialAnalysis(true);
    setLoading(true);
    try {
      let text = "";

      // For txt files, read directly; for pdf/docx use server-side extraction
      if (file.name.endsWith(".txt") || file.type === "text/plain") {
        text = await file.text();
      } else {
        const extractBody = new FormData();
        extractBody.append("file", file);
        const extractRes = await fetch("/api/extract-text", { method: "POST", body: extractBody });
        const extractJson = await extractRes.json();
        if (!extractRes.ok) {
          setError(extractJson.error ?? "Could not extract text from file.");
          setLoading(false);
          return;
        }
        text = extractJson.text;
      }

      text = text.trim();
      if (text.length < 10) {
        setError("Could not extract enough text from the file. For best results with PDF/DOCX, copy-paste the text into a .txt file.");
        setLoading(false);
        return;
      }

      setEssayText(text);

      // Send initial chat
      const userMsg = prompt.trim() || "Please coach me on this essay.";
      const chatRes = await fetch("/api/pro-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essay_text: text,
          user_message: userMsg,
          conversation_history: [],
        }),
      });

      const chatJson = await chatRes.json();
      if (!chatRes.ok) {
        setError(chatJson.error ?? `Server error ${chatRes.status}`);
        setLoading(false);
        return;
      }

      const proResult = chatJson as ProChatResult;
      setChatMessages([
        { role: "user", content: userMsg },
        { role: "assistant", content: proResult.coach_message_markdown },
      ]);
      setChatSuggestedActions(proResult.suggested_next_actions ?? []);
      if (proResult.coach_state) setCoachState(proResult.coach_state);
      setChatStarted(true);
    } catch {
      setError("Network error — could not reach server.");
    } finally {
      setLoading(false);
      // Reset after a brief delay to allow progress bar completion animation
      setTimeout(() => setIsInitialAnalysis(false), 600);
    }
  }

  // ── Pro: send follow-up ──
  async function handleProSend(msg: string) {
    const newMessages: ChatMessage[] = [...chatMessages, { role: "user", content: msg }];
    setChatMessages(newMessages);
    setChatSuggestedActions([]);
    setLoading(true);
    setError(null);

    try {
      // Only send last 10 turns as history (excluding the new message)
      const history = chatMessages.slice(-10);

      const res = await fetch("/api/pro-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essay_text: essayText,
          user_message: msg,
          conversation_history: history,
          turn_type: "followup_response",
          coach_state: coachState,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? `Server error ${res.status}`);
      } else {
        const proResult = json as ProChatResult;
        setChatMessages([
          ...newMessages,
          { role: "assistant", content: proResult.coach_message_markdown },
        ]);
        setChatSuggestedActions(proResult.suggested_next_actions ?? []);
        if (proResult.coach_state) setCoachState(proResult.coach_state);
      }
    } catch {
      setError("Network error — could not reach server.");
    } finally {
      setLoading(false);
    }
  }

  // ── Free → Pro handoff: start chat from gate question answer ──
  // Note: This is a quick chat response, NOT the initial long analysis.
  // Don't show the progress bar for handoff - only for initial analysis.
  async function handleHandoffToChat(userAnswer: string) {
    if (!file || !reportResult) return;

    // Don't set isInitialAnalysis - handoff is quick, not a long analysis
    setLoading(true);
    setError(null);

    try {
      let text = essayText;

      // Extract text if not already cached
      if (!text) {
        if (file.name.endsWith(".txt") || file.type === "text/plain") {
          text = await file.text();
        } else {
          const extractBody = new FormData();
          extractBody.append("file", file);
          const extractRes = await fetch("/api/extract-text", { method: "POST", body: extractBody });
          const extractJson = await extractRes.json();
          if (!extractRes.ok) {
            setError(extractJson.error ?? "Could not extract text from file.");
            setLoading(false);
            return;
          }
          text = extractJson.text;
        }
        text = text.trim();
        setEssayText(text);
      }

      // Build context-aware first message
      const gateQuestion = reportResult.student_output.what_happens_next.gate_question;
      const contextMsg = `The coach asked: "${gateQuestion}"\n\nMy answer: ${userAnswer}`;

      // Send initial chat with handoff context
      const chatRes = await fetch("/api/pro-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essay_text: text,
          user_message: contextMsg,
          conversation_history: [],
          turn_type: "handoff_first_turn",
        }),
      });

      const chatJson = await chatRes.json();
      if (!chatRes.ok) {
        setError(chatJson.error ?? `Server error ${chatRes.status}`);
        setLoading(false);
        return;
      }

      const proResult = chatJson as ProChatResult;
      setChatMessages([
        { role: "user", content: userAnswer },
        { role: "assistant", content: proResult.coach_message_markdown },
      ]);
      setChatSuggestedActions(proResult.suggested_next_actions ?? []);
      if (proResult.coach_state) setCoachState(proResult.coach_state);
      setChatStarted(true);
      setReportCollapsed(true); // Collapse the report, show chat
      setHandoffChatInput("");
    } catch {
      setError("Network error — could not reach server.");
    } finally {
      setLoading(false);
    }
  }

  const isPro = tier === "pro";
  // Only show progress bar for initial analysis, not follow-ups or handoffs
  const showProgress = loading && isInitialAnalysis;
  const progress = useAnalysisProgress(showProgress);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            AI Essay Coach
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Upload your essay and get coaching feedback.
          </p>
        </div>
        {/* Tier dropdown */}
        <select
          value={tier}
          onChange={(e) => {
            setTier(e.target.value as Tier);
            resetResults();
          }}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 shadow-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        >
          {TIER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <form
        onSubmit={isPro ? handleProStart : handleReportSubmit}
        className="mt-8 space-y-5"
      >
        {/* Drop zone */}
        <div>
          <label className="block text-sm font-medium text-zinc-900 mb-1">
            Essay file{" "}
            <span className="font-normal text-zinc-500">(txt, pdf, or docx — max 10 MB)</span>
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileRef.current?.click()}
            className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
              dragging
                ? "border-zinc-900 bg-zinc-50"
                : file
                  ? "border-zinc-300 bg-zinc-50"
                  : "border-zinc-300 bg-white hover:border-zinc-400 hover:bg-zinc-50"
            }`}
          >
            {file ? (
              <p className="text-sm text-zinc-700">
                <span className="font-medium">{file.name}</span>{" "}
                <span className="text-zinc-500">
                  ({(file.size / 1024).toFixed(0)} KB)
                </span>
              </p>
            ) : (
              <>
                <svg
                  className="mb-2 h-8 w-8 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3.75 3.75 0 013.57 5.495A3.001 3.001 0 0118 19.5H6.75z"
                  />
                </svg>
                <p className="text-sm text-zinc-600">
                  <span className="font-medium text-zinc-900">Click to upload</span> or drag
                  and drop
                </p>
                <p className="mt-1 text-xs text-zinc-500">.txt, .pdf, or .docx</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {file && (
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="mt-2 text-xs text-zinc-500 underline hover:text-zinc-700"
            >
              Remove file
            </button>
          )}
        </div>

        {/* Prompt / initial message */}
        {!chatStarted && (
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-zinc-900">
              {isPro ? "First message to your coach" : "Prompt"}{" "}
              <span className="font-normal text-zinc-500">(optional)</span>
            </label>
            <textarea
              id="prompt"
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              placeholder={
                isPro
                  ? "e.g. I'm stuck on the ending — can you help me figure out where to stop?"
                  : "e.g. Focus on narrative structure and voice."
              }
            />
          </div>
        )}

        {/* Submit (only before chat starts) */}
        {!chatStarted && (
          <button
            type="submit"
            disabled={loading || !file}
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Analyzing…" : isPro ? "Start coaching session" : "Analyze"}
          </button>
        )}
      </form>

      {/* Progress bar (only for initial analysis, not follow-ups) */}
      {isInitialAnalysis && progress > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-zinc-600">
              {progress < 30 ? "Reading your essay…" : progress < 65 ? "Coaching in progress…" : progress < 92 ? "Finalizing feedback…" : progress >= 100 ? "Done!" : "Almost there…"}
            </span>
            <span className="text-xs tabular-nums text-zinc-500">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-zinc-900 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Collapsible report summary (shown above chat after Free→Pro handoff) */}
      {chatStarted && reportResult && (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setReportCollapsed(!reportCollapsed)}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                Initial analysis
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-900 truncate">
                {reportResult.student_output.headline}
              </p>
            </div>
            <svg
              className={`ml-3 h-5 w-5 text-zinc-400 shrink-0 transition-transform ${reportCollapsed ? "" : "rotate-180"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {!reportCollapsed && (
            <div className="px-5 pb-5 border-t border-zinc-100">
              <div className="pt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                    What to fix first
                  </p>
                  <p className="mt-1 text-sm text-zinc-700">
                    {reportResult.student_output.what_to_fix_first}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                    Key concept
                  </p>
                  <p className="mt-1 text-sm text-zinc-700">
                    {reportResult.student_output.concept_taught}
                  </p>
                </div>
                {/* Rubric scores */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-3">
                    Rubric scores
                  </p>
                  <div className="space-y-2">
                    {reportResult.analysis.rubric_scores.map((rs) => (
                      <div key={rs.rubric_id} className="flex items-center gap-3">
                        <span className="text-xs text-zinc-700 w-36 shrink-0">
                          {RUBRIC_LABELS[rs.rubric_id] ?? rs.rubric_id}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-zinc-100">
                          <div
                            className={`h-1.5 rounded-full transition-all ${scoreColor(rs.score)}`}
                            style={{ width: `${(rs.score / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-zinc-500 w-6 text-right">
                          {rs.score}/5
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pro chat view (shown for Pro tier OR after Free→Pro handoff) */}
      {chatStarted && (
        <ProChatView
          messages={chatMessages}
          loading={loading}
          onSend={handleProSend}
          suggestedActions={chatSuggestedActions}
        />
      )}

      {/* Report view (Free tier) with in-place Pro handoff */}
      {!chatStarted && reportResult && (
        <AnalysisReport
          data={reportResult}
          onStartChat={handleHandoffToChat}
          chatInput={handoffChatInput}
          setChatInput={setHandoffChatInput}
          loading={loading}
        />
      )}
    </div>
  );
}

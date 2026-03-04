"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import type {
  Student,
  Session,
  Portrait,
  DevelopmentStage,
  SessionType,
} from "@/lib/supabase";

// ── helpers ──────────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<DevelopmentStage, string> = {
  exploration: "Exploration",
  narrative_dev: "Narrative Dev",
  application_ready: "Application Ready",
  post_admissions: "Post-Admissions",
};

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  essay_work: "Essay Work",
  generative: "Generative",
  parent_call: "Parent Call",
};

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── add-student modal ─────────────────────────────────────────────────────────

function AddStudentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (s: Student) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    age: "",
    grade: "",
    start_date: "",
    cultural_background: "",
    family_language_pref: "",
    development_stage: "exploration" as DevelopmentStage,
    seed_notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/lab/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        age: form.age ? parseInt(form.age) : null,
        start_date: form.start_date || null,
      }),
    });
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? "Failed");
      setSaving(false);
      return;
    }
    const student = await res.json();
    onCreated(student);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Add Student
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Name *">
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age">
              <input
                type="number"
                min={8}
                max={22}
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Grade">
              <input
                value={form.grade}
                onChange={(e) => set("grade", e.target.value)}
                placeholder="e.g. 9th"
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Start Date">
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => set("start_date", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Cultural Background">
            <input
              value={form.cultural_background}
              onChange={(e) => set("cultural_background", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Family Language">
            <input
              value={form.family_language_pref}
              onChange={(e) => set("family_language_pref", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Development Stage">
            <select
              value={form.development_stage}
              onChange={(e) =>
                set("development_stage", e.target.value as DevelopmentStage)
              }
              className={inputCls}
            >
              {Object.entries(STAGE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Seed Notes (intake impressions)">
            <textarea
              value={form.seed_notes}
              onChange={(e) => set("seed_notes", e.target.value)}
              rows={4}
              className={inputCls}
            />
          </Field>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded border border-zinc-300 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded bg-zinc-900 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {saving ? "Saving…" : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── add-session form ──────────────────────────────────────────────────────────

function AddSessionForm({
  studentId,
  onAdded,
  onPortraitUpdated,
}: {
  studentId: string;
  onAdded: (session: Session) => void;
  onPortraitUpdated: (portrait: Portrait) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    session_type: "generative" as SessionType,
    raw_notes: "",
    key_observations: "",
  });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/lab/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, ...form }),
    });

    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? "Failed to save session");
      setSaving(false);
      return;
    }

    const session = await res.json();
    onAdded(session);

    // Auto-regenerate portrait after each new session
    setGenerating(true);
    try {
      const portraitRes = await fetch("/api/lab/generate-portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, new_session_id: session.id }),
      });
      if (portraitRes.ok) {
        const newPortrait = await portraitRes.json();
        onPortraitUpdated(newPortrait);
      }
    } catch {
      // non-fatal — portrait regeneration failure shouldn't block session save
    }
    setGenerating(false);

    // Reset form
    setForm((f) => ({ ...f, raw_notes: "", key_observations: "" }));
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 flex items-center gap-1.5 rounded border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-500 hover:border-zinc-400 hover:text-zinc-700"
      >
        <span className="text-base leading-none">+</span> Add Session
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
        New Session
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Type">
            <select
              value={form.session_type}
              onChange={(e) => set("session_type", e.target.value as SessionType)}
              className={inputCls}
            >
              {Object.entries(SESSION_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Raw Notes">
          <textarea
            value={form.raw_notes}
            onChange={(e) => set("raw_notes", e.target.value)}
            rows={5}
            placeholder="Everything from the session — messy is fine"
            className={inputCls}
          />
        </Field>
        <Field label="Key Observations">
          <textarea
            value={form.key_observations}
            onChange={(e) => set("key_observations", e.target.value)}
            rows={3}
            placeholder="What stood out — patterns, moments, shifts"
            className={inputCls}
          />
        </Field>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {generating && (
          <p className="text-xs text-zinc-400">Regenerating portrait…</p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save + Regenerate Portrait"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── portrait card ─────────────────────────────────────────────────────────────

function PortraitCard({
  portrait,
  studentId,
  onRegenerated,
}: {
  portrait: Portrait | null;
  studentId: string;
  onRegenerated: (p: Portrait) => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function regenerate() {
    setGenerating(true);
    setError("");
    const res = await fetch("/api/lab/generate-portrait", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId }),
    });
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? "Failed");
    } else {
      const p = await res.json();
      onRegenerated(p);
    }
    setGenerating(false);
  }

  if (!portrait) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Portrait
          </h2>
          <button
            onClick={regenerate}
            disabled={generating}
            className="rounded bg-zinc-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
          >
            {generating ? "Generating…" : "Generate Initial Portrait"}
          </button>
        </div>
        <p className="text-xs text-zinc-400">No portrait yet.</p>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  const c = portrait.content_json;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Portrait
          </h2>
          <p className="mt-0.5 text-xs text-zinc-300">
            Updated {new Date(portrait.generated_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={regenerate}
          disabled={generating}
          className="rounded border border-zinc-200 px-3 py-1 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
        >
          {generating ? "Regenerating…" : "Regenerate"}
        </button>
      </div>

      <div className="space-y-5">
        {c.portrait_narrative && (
          <p className="border-b border-zinc-100 pb-5 text-sm leading-relaxed text-zinc-700 italic">
            {c.portrait_narrative}
          </p>
        )}

        {c.current_growth_edge && (
          <PortraitSection label="Current Growth Edge">
            <p className="text-sm leading-relaxed text-zinc-800">
              {c.current_growth_edge}
            </p>
          </PortraitSection>
        )}

        {c.thinking_moves?.length > 0 && (
          <PortraitSection label="Thinking Moves">
            <ul className="space-y-1">
              {c.thinking_moves.map((m, i) => (
                <li key={i} className="text-sm text-zinc-700">
                  — {m}
                </li>
              ))}
            </ul>
          </PortraitSection>
        )}

        {c.recurring_patterns?.length > 0 && (
          <PortraitSection label="Recurring Patterns">
            <ul className="space-y-1">
              {c.recurring_patterns.map((p, i) => (
                <li key={i} className="text-sm text-zinc-700">
                  — {p}
                </li>
              ))}
            </ul>
          </PortraitSection>
        )}

        {c.voice_characteristics?.length > 0 && (
          <PortraitSection label="Voice">
            <ul className="space-y-1">
              {c.voice_characteristics.map((v, i) => (
                <li key={i} className="text-sm text-zinc-700">
                  — {v}
                </li>
              ))}
            </ul>
          </PortraitSection>
        )}

        {c.next_session_focus && (
          <PortraitSection label="Next Session Focus">
            <p className="text-sm leading-relaxed text-zinc-800">
              {c.next_session_focus}
            </p>
          </PortraitSection>
        )}
      </div>

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function PortraitSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-400">
        {label}
      </p>
      {children}
    </div>
  );
}

// ── session list ──────────────────────────────────────────────────────────────

function SessionList({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return <p className="text-xs text-zinc-400">No sessions yet.</p>;
  }

  return (
    <div className="space-y-4">
      {sessions.map((s) => (
        <div
          key={s.id}
          className="rounded-lg border border-zinc-200 bg-white p-4"
        >
          <div className="mb-2 flex items-center gap-3">
            <span className="text-xs font-medium text-zinc-900">
              {formatDate(s.date)}
            </span>
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
              {SESSION_TYPE_LABELS[s.session_type]}
            </span>
          </div>
          {s.key_observations && (
            <div className="mb-2">
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                Observations
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                {s.key_observations}
              </p>
            </div>
          )}
          {s.raw_notes && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-zinc-400 hover:text-zinc-600">
                Raw notes
              </summary>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-500">
                {s.raw_notes}
              </p>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}

// ── markdown renderer (minimal: bold, italic, line breaks) ───────────────────

function Markdown({ text }: { text: string }) {
  // Convert **bold**, *italic*, and newlines to JSX
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\n)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("*") && part.endsWith("*"))
          return <em key={i}>{part.slice(1, -1)}</em>;
        if (part === "\n") return <br key={i} />;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ── agent session tab ─────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function AgentSessionTab({ student }: { student: Student }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [saved, setSaved] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendToAgent(msgs: ChatMessage[]) {
    setIsStreaming(true);
    // Add empty assistant bubble to stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/agent-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, messages: msgs }),
      });

      if (!res.ok || !res.body) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "Something went wrong. Please try again.",
          };
          return updated;
        });
        setIsStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: updated[updated.length - 1].content + delta,
                };
                return updated;
              });
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Connection error. Please try again.",
        };
        return updated;
      });
    }

    setIsStreaming(false);
  }

  async function startSession() {
    setIsActive(true);
    setSaved(false);
    const openingInstruction: ChatMessage = {
      role: "user",
      content:
        "__system: Open the session. Check in with the student — ask where they are and what they want to work on today.",
    };
    await sendToAgent([openingInstruction]);
    // Don't expose the system instruction in the thread
    setMessages((prev) => prev.filter((m) => m.role === "assistant"));
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    const updated: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(updated);
    await sendToAgent(updated);
  }

  async function endSession() {
    if (messages.length === 0) {
      setIsActive(false);
      return;
    }

    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

    await fetch("/api/lab/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: student.id,
        date: new Date().toISOString().split("T")[0],
        session_type: "agent_session",
        raw_notes: JSON.stringify(messages),
        key_observations: lastAssistant?.content ?? "",
      }),
    });

    setSaved(true);
    setIsActive(false);
    setMessages([]);
  }

  if (!isActive) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        {saved && (
          <p className="text-xs text-zinc-400">Session saved.</p>
        )}
        <button
          onClick={startSession}
          className="rounded bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Start Session
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[72%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-800"
              }`}
            >
              {msg.role === "assistant" ? (
                <Markdown text={msg.content || "…"} />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-none border-t border-zinc-200 px-4 py-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          disabled={isStreaming}
          placeholder="Type a message…"
          className="flex-1 rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={isStreaming || !input.trim()}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Send
        </button>
        <button
          onClick={endSession}
          disabled={isStreaming}
          className="rounded border border-zinc-200 px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
        >
          End
        </button>
      </div>
    </div>
  );
}

// ── student view ──────────────────────────────────────────────────────────────

type Tab = "portrait" | "log" | "session";

function StudentView({ student }: { student: Student }) {
  const [tab, setTab] = useState<Tab>("portrait");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [portrait, setPortrait] = useState<Portrait | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [sRes, pRes] = await Promise.all([
      fetch(`/api/lab/sessions?student_id=${student.id}`),
      fetch(`/api/lab/portraits?student_id=${student.id}`),
    ]);
    if (sRes.ok) setSessions(await sRes.json());
    if (pRes.ok) setPortrait(await pRes.json());
    setLoading(false);
  }, [student.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleSessionAdded(session: Session) {
    setSessions((prev) => [session, ...prev]);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-xs text-zinc-400">Loading…</span>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "portrait", label: "Portrait" },
    { id: "log", label: "Session Log" },
    { id: "session", label: "Session" },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Student header */}
      <div className="flex-none border-b border-zinc-200 px-6 pt-4 pb-0">
        <div className="flex items-baseline gap-3 mb-3">
          <h1 className="text-lg font-semibold text-zinc-900">{student.name}</h1>
          {student.grade && (
            <span className="text-sm text-zinc-400">{student.grade}</span>
          )}
          <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
            {STAGE_LABELS[student.development_stage]}
          </span>
        </div>
        {student.cultural_background && (
          <p className="mb-3 text-xs text-zinc-400">
            {student.cultural_background}
            {student.family_language_pref ? ` · ${student.family_language_pref}` : ""}
          </p>
        )}
        {/* Tabs */}
        <div className="flex gap-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab === "portrait" && (
          <div className="h-full overflow-y-auto px-6 py-5">
            <div className="mx-auto max-w-2xl">
              <PortraitCard
                portrait={portrait}
                studentId={student.id}
                onRegenerated={setPortrait}
              />
            </div>
          </div>
        )}

        {tab === "log" && (
          <div className="h-full overflow-y-auto px-6 py-5">
            <div className="mx-auto max-w-2xl space-y-4">
              <AddSessionForm
                studentId={student.id}
                onAdded={handleSessionAdded}
                onPortraitUpdated={setPortrait}
              />
              <div className="mt-2">
                <SessionList sessions={sessions} />
              </div>
            </div>
          </div>
        )}

        {tab === "session" && (
          <AgentSessionTab student={student} />
        )}
      </div>
    </div>
  );
}

// ── sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  students,
  selectedId,
  onSelect,
  onAddStudent,
}: {
  students: Student[];
  selectedId: string | null;
  onSelect: (s: Student) => void;
  onAddStudent: () => void;
}) {
  return (
    <div className="flex h-full flex-col border-r border-zinc-200 bg-zinc-50">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Students
        </span>
        <button
          onClick={onAddStudent}
          className="rounded px-2 py-0.5 text-xs text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
          title="Add student"
        >
          + New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {students.length === 0 && (
          <p className="px-4 py-3 text-xs text-zinc-400">No students yet.</p>
        )}
        {students.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className={`w-full px-4 py-2.5 text-left transition-colors ${
              selectedId === s.id
                ? "bg-white text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            <p className="text-sm font-medium leading-snug">{s.name}</p>
            <p className="text-xs text-zinc-400">
              {s.grade ? `${s.grade} · ` : ""}
              {STAGE_LABELS[s.development_stage]}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── tiny form field wrapper ───────────────────────────────────────────────────

const inputCls =
  "w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-zinc-500">{label}</label>
      {children}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function LabPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    fetch("/api/lab/students")
      .then((r) => r.json())
      .then((data) => {
        setStudents(data);
        setLoadingStudents(false);
      });
  }, []);

  function handleStudentCreated(s: Student) {
    setStudents((prev) => [...prev, s].sort((a, b) => a.name.localeCompare(b.name)));
    setSelected(s);
    setShowAddStudent(false);
  }

  return (
    <>
      {/* Top bar */}
      <div className="flex h-10 items-center justify-between border-b border-zinc-200 bg-white px-4">
        <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
          StoryLab · Internal
        </span>
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-zinc-400 hover:text-zinc-600">
            ← Site
          </a>
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Split pane */}
      <div
        className="flex"
        style={{ height: "calc(100dvh - 2.5rem)" }}
      >
        {/* Sidebar */}
        <div className="w-52 flex-none">
          {loadingStudents ? (
            <div className="flex h-full items-center justify-center">
              <span className="text-xs text-zinc-400">Loading…</span>
            </div>
          ) : (
            <Sidebar
              students={students}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
              onAddStudent={() => setShowAddStudent(true)}
            />
          )}
        </div>

        {/* Main panel */}
        <div className="flex-1 overflow-hidden">
          {selected ? (
            <StudentView key={selected.id} student={selected} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-xs text-zinc-400">
                {students.length === 0
                  ? "Add a student to get started."
                  : "Select a student."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add student modal */}
      {showAddStudent && (
        <AddStudentModal
          onClose={() => setShowAddStudent(false)}
          onCreated={handleStudentCreated}
        />
      )}
    </>
  );
}

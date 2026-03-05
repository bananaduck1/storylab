"use client";

import { useState, useEffect, useRef } from "react";

interface Student {
  id: string;
  name: string;
  grade: string | null;
  development_stage: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type Mode = "teacher" | "student";

// ── markdown renderer ─────────────────────────────────────────────────────────

function Markdown({ text }: { text: string }) {
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

// ── session chat ──────────────────────────────────────────────────────────────

function SessionChat({
  student,
  mode,
}: {
  student: Student;
  mode: Mode;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showDebrief, setShowDebrief] = useState(false);
  const [debriefNotes, setDebriefNotes] = useState("");
  const [debriefDate, setDebriefDate] = useState(new Date().toISOString().split("T")[0]);
  const [debriefType, setDebriefType] = useState("generative");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function streamResponse(msgs: ChatMessage[]) {
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/agent-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, messages: msgs, mode }),
      });

      if (!res.ok || !res.body) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: "Error — please try again." };
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
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Connection error." };
        return updated;
      });
    }

    setIsStreaming(false);
  }

  async function startSession() {
    setIsActive(true);
    setSaved(false);
    const opening: ChatMessage = {
      role: "user",
      content: mode === "teacher"
        ? `__system: Open the teacher session for ${student.name}. Summarize their portrait in 2–3 lines and suggest one or two things to focus on today.`
        : `__system: Open the session. Check in with the student — ask where they are and what they want to work on today.`,
    };
    await streamResponse([opening]);
    setMessages((prev) => prev.filter((m) => m.role === "assistant"));
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    const updated: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(updated);
    await streamResponse(updated);
  }

  function openDebrief() {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    setDebriefNotes(last?.content ?? "");
    setShowDebrief(true);
  }

  async function saveDebrief() {
    setSaving(true);
    await fetch("/api/lab/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: student.id,
        date: debriefDate,
        session_type: debriefType,
        raw_notes: JSON.stringify(messages),
        key_observations: debriefNotes,
      }),
    });
    setSaving(false);
    setShowDebrief(false);
    setIsActive(false);
    setMessages([]);
    setSaved(true);
  }

  if (!isActive) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        {saved && <p className="text-xs text-zinc-400">Session saved.</p>}
        <p className="text-xs text-zinc-500 mb-1">
          {mode === "teacher" ? "Live coaching assistant — advises the teacher." : "Student-facing check-in agent."}
        </p>
        <button
          onClick={startSession}
          className="rounded bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Start {mode === "teacher" ? "Teacher" : "Student"} Session
        </button>
      </div>
    );
  }

  if (showDebrief) {
    return (
      <div className="h-full overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-lg space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900">End of Session — Debrief</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Date</label>
              <input
                type="date"
                value={debriefDate}
                onChange={(e) => setDebriefDate(e.target.value)}
                className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Type</label>
              <select
                value={debriefType}
                onChange={(e) => setDebriefType(e.target.value)}
                className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500"
              >
                <option value="generative">Generative</option>
                <option value="essay_work">Essay Work</option>
                <option value="parent_call">Parent Call</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Key Observations</label>
            <textarea
              value={debriefNotes}
              onChange={(e) => setDebriefNotes(e.target.value)}
              rows={8}
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 resize-y"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDebrief(false)}
              className="rounded border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"
            >
              Back
            </button>
            <button
              onClick={saveDebrief}
              disabled={saving}
              className="rounded bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save Session"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[72%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === "user" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-800"
            }`}>
              {msg.role === "assistant" ? <Markdown text={msg.content || "…"} /> : msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex-none border-t border-zinc-200 px-4 py-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          disabled={isStreaming}
          placeholder={mode === "teacher" ? "Ask for guidance…" : "Type a message…"}
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
          onClick={mode === "teacher" ? openDebrief : () => { setIsActive(false); setMessages([]); setSaved(true); }}
          disabled={isStreaming}
          className="rounded border border-zinc-200 px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
        >
          End
        </button>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  exploration: "Exploration",
  narrative_dev: "Narrative Dev",
  application_ready: "Application Ready",
  post_admissions: "Post-Admissions",
};

export default function AdminSessionsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [mode, setMode] = useState<Mode>("teacher");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lab/students")
      .then((r) => r.json())
      .then((data) => {
        setStudents(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex" style={{ height: "calc(100dvh - 45px)" }}>
      {/* Sidebar */}
      <div className="w-52 flex-none flex flex-col border-r border-zinc-200 bg-zinc-50">
        <div className="border-b border-zinc-200 px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Students</span>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {loading && <p className="px-4 py-3 text-xs text-zinc-400">Loading…</p>}
          {!loading && students.length === 0 && (
            <p className="px-4 py-3 text-xs text-zinc-400">No students yet.</p>
          )}
          {students.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className={`w-full px-4 py-2.5 text-left transition-colors ${
                selected?.id === s.id ? "bg-white text-zinc-900" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <p className="text-sm font-medium leading-snug">{s.name}</p>
              <p className="text-xs text-zinc-400">
                {s.grade ? `${s.grade} · ` : ""}{STAGE_LABELS[s.development_stage] ?? s.development_stage}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <>
            {/* Student header + mode tabs */}
            <div className="flex-none border-b border-zinc-200 px-6 pt-4 pb-0">
              <div className="flex items-baseline gap-3 mb-3">
                <h1 className="text-base font-semibold text-zinc-900">{selected.name}</h1>
                {selected.grade && <span className="text-sm text-zinc-400">{selected.grade}</span>}
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                  {STAGE_LABELS[selected.development_stage] ?? selected.development_stage}
                </span>
              </div>
              <div className="flex gap-0">
                {(["teacher", "student"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors capitalize ${
                      mode === m
                        ? "border-zinc-900 text-zinc-900"
                        : "border-transparent text-zinc-400 hover:text-zinc-600"
                    }`}
                  >
                    {m === "teacher" ? "Teacher Session" : "Student Session"}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat — remount on student or mode change */}
            <div className="flex-1 overflow-hidden">
              <SessionChat key={`${selected.id}-${mode}`} student={selected} mode={mode} />
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-zinc-400">Select a student to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}

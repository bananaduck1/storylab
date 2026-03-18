"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import NotificationBell from "@/app/_components/NotificationBell";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  essay_mode?: "common_app" | "transfer" | "academic" | "supplemental";
}

interface Message {
  id: string;
  role: string;
  content: string;
  file_name: string | null;
  created_at: string;
}

interface AttachedFile {
  text: string;
  file_name: string;
  file_type: string;
}

interface QuotaInfo {
  plan: "free" | "monthly";
  remaining: number;
  limit: number;
  extraMessages: number;
}

interface LabChatProps {
  profile: { full_name: string; grade: string } | null;
  conversations: Conversation[];
  activeConversationId: string;
  initialMessages: Message[];
  quota: QuotaInfo;
  successType?: "subscription" | "topup" | null;
  /** False only for student users who haven't claimed a students record yet. */
  isLinked?: boolean;
  /** True if this user also has a teacher profile — shows role switcher. */
  isTeacher?: boolean;
  /** True if this user is the platform founder — shows role switcher with Platform option. */
  isFounder?: boolean;
  /** True if teacher opens /lab but has no student_profile yet — show lifelong learner banner. */
  showTeacherLearnerBanner?: boolean;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function truncateTitle(title: string, max = 30): string {
  return title.length > max ? title.slice(0, max).trimEnd() + "…" : title;
}

function QuotaChip({ remaining, limit, plan }: { remaining: number; limit: number; plan: "free" | "monthly" }) {
  const color =
    remaining <= 3
      ? "bg-red-50 text-red-600 border-red-200"
      : remaining <= 10
      ? "bg-amber-50 text-amber-600 border-amber-200"
      : "bg-green-50 text-green-600 border-green-200";

  const label = plan === "monthly" ? "mo" : "today";

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${color}`}>
      {remaining} / {limit} {label}
    </span>
  );
}

export default function LabChat({
  profile,
  conversations: initialConversations,
  activeConversationId,
  initialMessages,
  quota,
  successType,
  isLinked = true,
  isTeacher = false,
  isFounder = false,
  showTeacherLearnerBanner = false,
}: LabChatProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConvId, setActiveConvId] = useState(activeConversationId);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);
  const [quotaRemaining, setQuotaRemaining] = useState(quota.remaining);
  // Track limit in state so it stays consistent as extra_messages drain mid-session.
  // When extras are exhausted the limit snaps down to the base daily/monthly cap.
  const FREE_DAILY_CAP = 50;
  const [quotaLimit, setQuotaLimit] = useState(quota.limit);
  const [loadingConv, setLoadingConv] = useState(false);
  const [convLoadError, setConvLoadError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(
    successType === "subscription"
      ? "You're now on the Monthly plan — 500 messages/month!"
      : successType === "topup"
      ? "Done! 100 messages have been added to your account."
      : null
  );
  const [checkingOut, setCheckingOut] = useState<"subscribe" | "topup" | "portal" | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [selectedMode, setSelectedMode] = useState<"common_app" | "transfer" | "academic" | "supplemental">("common_app");

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFirstMount = useRef(true);
  const isModeFirstRender = useRef(true);

  // When the mode picker changes on an empty conversation, PATCH the conversation
  // so the server uses the correct mode constraints from the very first message.
  useEffect(() => {
    if (isModeFirstRender.current) {
      isModeFirstRender.current = false;
      return;
    }
    if (messages.length > 0) return;
    fetch(`/api/lab/conversations/${activeConvId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ essay_mode: selectedMode }),
    }).catch(() => {/* best-effort */});
    // Update the conversation list optimistically so the mode badge stays accurate
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConvId ? { ...c, essay_mode: selectedMode } : c))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMode]);

  // Dismiss success banner after 6 s and clear the URL param
  useEffect(() => {
    if (!successBanner) return;
    const t = setTimeout(() => {
      setSuccessBanner(null);
      // Remove ?success from URL without triggering a navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url.toString());
    }, 6000);
    return () => clearTimeout(t);
  }, [successBanner]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const convIdAtSwitch = activeConvId;
    // Sync mode picker to the switched conversation's mode
    const switchedConv = conversations.find((c) => c.id === convIdAtSwitch);
    if (switchedConv?.essay_mode) {
      isModeFirstRender.current = true; // suppress the PATCH effect on auto-sync
      setSelectedMode(switchedConv.essay_mode);
    }
    async function loadMessages() {
      setLoadingConv(true);
      setConvLoadError(null);
      try {
        const res = await fetch(`/api/lab/conversations/${convIdAtSwitch}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        } else {
          throw new Error("Failed to load conversation");
        }
      } catch {
        setConvLoadError("Couldn't load this conversation. Please try again.");
        setActiveConvId((prev) => (prev === convIdAtSwitch ? activeConversationId : prev));
      } finally {
        setLoadingConv(false);
      }
    }
    loadMessages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId]);

  async function signOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function newConversation(mode?: "common_app" | "transfer" | "academic" | "supplemental") {
    const essay_mode = mode ?? selectedMode;
    try {
      const res = await fetch("/api/lab/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New conversation", essay_mode }),
      });
      if (res.ok) {
        const conv = await res.json();
        setConversations((prev) => [conv, ...prev]);
        setActiveConvId(conv.id);
        setMessages([]);
        setSidebarOpen(false);
      }
    } catch {
      // ignore
    }
  }

  async function switchConversation(convId: string) {
    if (convId === activeConvId) return;
    setActiveConvId(convId);
    setSidebarOpen(false);
  }

  async function deleteConversation(id: string) {
    if (!window.confirm("Delete this conversation?")) return;
    try {
      const res = await fetch(`/api/lab/conversations/${id}`, { method: "DELETE" });
      if (!res.ok) return; // server rejected — leave UI unchanged
    } catch {
      return; // network error — leave UI unchanged
    }
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    if (activeConvId === id) {
      if (remaining.length > 0) {
        switchConversation(remaining[0].id);
      } else {
        newConversation();
      }
    }
  }

  function startRename(id: string, title: string) {
    setRenamingId(id);
    setRenameTitle(title);
  }

  async function commitRename(id: string) {
    const trimmed = renameTitle.trim();
    setRenamingId(null);
    if (!trimmed) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: trimmed } : c))
    );
    try {
      await fetch(`/api/lab/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
    } catch {
      // ignore — title already updated optimistically
    }
  }

  async function refreshConversations() {
    try {
      const res = await fetch("/api/lab/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {
      // ignore
    }
  }

  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") {
      setFileError("Please upload a .pdf or .docx file.");
      return;
    }
    setFileError(null);
    setParsingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/lab/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setAttachedFile({ text: data.text, file_name: data.file_name, file_type: data.file_type });
      } else {
        const err = await res.json();
        setFileError(err.error || "Failed to parse file.");
      }
    } catch {
      setFileError("Failed to upload file. Please try again.");
    } finally {
      setParsingFile(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  async function startCheckout(type: "subscribe" | "topup" | "portal") {
    setCheckingOut(type);
    try {
      const endpoint =
        type === "subscribe" ? "/api/payments/subscribe"
        : type === "topup"    ? "/api/payments/topup"
        :                       "/api/payments/portal";
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Checkout error:", data.error);
      }
    } catch (err) {
      console.error("Checkout failed:", err);
    } finally {
      setCheckingOut(null);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || loading || quotaRemaining <= 0) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      file_name: attachedFile?.file_name ?? null,
      created_at: new Date().toISOString(),
    };

    const streamingId = "streaming";
    const streamingMessage: Message = {
      id: streamingId,
      role: "assistant",
      content: "",
      file_name: null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, streamingMessage]);
    setInput("");
    const fileToSend = attachedFile;
    setAttachedFile(null);
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const res = await fetch("/api/lab/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: activeConvId,
          message: text,
          file_text: fileToSend?.text,
          file_name: fileToSend?.file_name,
          file_type: fileToSend?.file_type,
        }),
      });

      if (res.status === 429) {
        const data = await res.json();
        const isMonthly = data.error === "monthly_limit_reached";
        pushErrorMessage(
          isMonthly
            ? "You've used all your messages for this month. Top up or wait for renewal."
            : "You've reached your daily message limit. Top up to keep going or come back tomorrow!"
        );
        setQuotaRemaining(0);
        return;
      }

      if (!res.ok || !res.body) {
        throw new Error("Request failed");
      }

      const remainingHeader = res.headers.get("X-RateLimit-Remaining");
      if (remainingHeader !== null) {
        const newRemaining = parseInt(remainingHeader, 10);
        setQuotaRemaining(newRemaining);
        // Once extras are exhausted, snap the limit down to the base cap
        // so the chip doesn't show "0 / 70" when only 50 is the real ceiling.
        if (quota.plan === "free") {
          setQuotaLimit(Math.max(newRemaining, FREE_DAILY_CAP));
        }
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const finalAccumulated = accumulated;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamingId ? { ...m, content: finalAccumulated } : m
          )
        );
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingId
            ? { ...m, id: crypto.randomUUID(), content: accumulated }
            : m
        )
      );

      if (messages.length === 0) {
        refreshConversations();
      }
    } catch {
      pushErrorMessage("Something went wrong. Please try again.");
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

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  }

  function pushErrorMessage(content: string) {
    setMessages((prev) => [
      ...prev.filter((m) => m.id !== "streaming"),
      { id: crypto.randomUUID(), role: "assistant", content, file_name: null, created_at: new Date().toISOString() },
    ]);
  }

  const firstName = profile?.full_name.split(" ")[0] ?? "";
  const inputDisabled = loading || quotaRemaining <= 0;
  const activeConv = conversations.find((c) => c.id === activeConvId);
  const activeMode = activeConv?.essay_mode ?? "common_app";

  const MODE_LABELS: Record<"common_app" | "transfer" | "academic" | "supplemental", string> = {
    common_app: "Common App",
    transfer: "Transfer",
    academic: "Academic",
    supplemental: "Supplemental",
  };

  return (
    <div
      className="flex h-dvh bg-white relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 pointer-events-none">
          <svg className="w-16 h-16 text-zinc-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <p className="text-zinc-600 font-medium text-lg">Drop your document here</p>
          <p className="text-zinc-400 text-sm mt-1">.pdf or .docx</p>
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          w-56 shrink-0 flex flex-col border-r border-zinc-100 bg-zinc-50
          fixed inset-y-0 left-0 z-30 transition-transform duration-200
          md:relative md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-zinc-900">StoryLab</span>
              {/* Role context switcher — only shown for multi-role users */}
              {(isTeacher || isFounder) && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 font-medium">Learning</span>
                  <Link
                    href="/dashboard"
                    className="text-xs px-2 py-0.5 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                  >
                    Teaching
                  </Link>
                  {isFounder && (
                    <Link
                      href="/admin/dashboard"
                      className="text-xs px-2 py-0.5 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                    >
                      Platform
                    </Link>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell variant="light" />
              <button
                className="md:hidden text-zinc-400 hover:text-zinc-600"
                onClick={() => setSidebarOpen(false)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* New chat button */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={() => newConversation()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100 transition-colors border border-zinc-200 bg-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {conversations.map((conv) => {
            const isActive = conv.id === activeConvId;
            const isRenaming = renamingId === conv.id;
            return (
              <div
                key={conv.id}
                className={`
                  group relative w-full text-left px-3 py-2.5 rounded-lg mb-0.5 transition-colors cursor-pointer
                  ${isActive
                    ? "bg-white border-l-2 border-zinc-900 shadow-sm"
                    : "hover:bg-zinc-100 border-l-2 border-transparent"
                  }
                `}
                onClick={() => !isRenaming && switchConversation(conv.id)}
              >
                {isRenaming ? (
                  <input
                    autoFocus
                    className="w-full text-xs font-medium text-zinc-900 bg-transparent border-b border-zinc-400 outline-none py-0.5 pr-6"
                    value={renameTitle}
                    onChange={(e) => setRenameTitle(e.target.value)}
                    onBlur={() => commitRename(conv.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); commitRename(conv.id); }
                      if (e.key === "Escape") { setRenamingId(null); }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <p
                    className={`text-xs font-medium truncate pr-6 ${isActive ? "text-zinc-900" : "text-zinc-700"}`}
                    onDoubleClick={(e) => { e.stopPropagation(); startRename(conv.id, conv.title); }}
                  >
                    {truncateTitle(conv.title)}
                  </p>
                )}
                <p className="text-xs text-zinc-400 mt-0.5">
                  {formatRelativeDate(conv.updated_at)}
                </p>
                {/* Delete button — hover reveal */}
                <button
                  className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-500"
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                  aria-label="Delete conversation"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        {/* Sidebar footer — plan + upgrade actions */}
        <div className="border-t border-zinc-100 px-3 py-3 space-y-2">
          {quota.plan === "free" && (
            <button
              onClick={() => startCheckout("subscribe")}
              disabled={checkingOut !== null}
              className="w-full text-xs px-3 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              {checkingOut === "subscribe" ? "Redirecting…" : "Upgrade — $49/mo"}
            </button>
          )}
          <button
            onClick={() => startCheckout("topup")}
            disabled={checkingOut !== null}
            className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            {checkingOut === "topup" ? "Redirecting…" : "Buy +100 msgs — $10"}
          </button>
          {quota.plan === "monthly" && (
            <button
              onClick={() => startCheckout("portal")}
              disabled={checkingOut !== null}
              className="block w-full text-left text-xs text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-50"
            >
              {checkingOut === "portal" ? "Redirecting…" : "Manage subscription"}
            </button>
          )}
          <a
            href="/lab/profile"
            className="block text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            Edit profile
          </a>
          <button
            onClick={signOut}
            className="block w-full text-left text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Claim banner — shown to student users who haven't linked their account */}
        {!isLinked && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3">
            <p className="text-sm text-amber-800 flex-1">
              Your teacher may have a profile on file for you. Ask them for your claim link to connect your accounts.
            </p>
          </div>
        )}

        {/* Lifelong learner banner — shown to teachers who haven't started their own /lab journey */}
        {showTeacherLearnerBanner && (
          <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2.5 flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-600 flex-1">
              StoryLab is for lifelong learners — teachers too. Start your own learning journey here.
            </p>
            <a
              href="/lab/onboarding"
              className="shrink-0 text-xs font-medium text-zinc-700 hover:text-zinc-900 underline underline-offset-2"
            >
              Set up your profile →
            </a>
          </div>
        )}

        {/* Success banner */}
        {successBanner && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-2.5 flex items-center justify-between">
            <p className="text-sm text-green-700">{successBanner}</p>
            <button
              onClick={() => setSuccessBanner(null)}
              className="text-green-400 hover:text-green-700 ml-4"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Chat header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              className="md:hidden text-zinc-400 hover:text-zinc-700"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div>
              <p className="text-sm font-medium text-zinc-900">{firstName}</p>
              {profile?.grade && <p className="text-xs text-zinc-400">{profile.grade} grade</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500">
                {MODE_LABELS[activeMode]}
              </span>
            )}
            <QuotaChip
              remaining={quotaRemaining}
              limit={quotaLimit}
              plan={quota.plan}
            />
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {loadingConv ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          ) : convLoadError ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-zinc-400">{convLoadError}</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-sm font-semibold">S</span>
                  </div>
                  <p className="text-zinc-500 text-sm mb-6">
                    Hi {firstName}! I&apos;m Sam, your essay coach. What would you like to work on today?
                  </p>
                  {/* Mode picker — only shown before the first message */}
                  <div className="inline-flex flex-col items-start gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4">
                    <p className="text-xs font-medium text-zinc-500 mb-1">Essay type</p>
                    {(["common_app", "transfer", "academic", "supplemental"] as const).map((m) => (
                      <label key={m} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="essay_mode"
                          value={m}
                          checked={selectedMode === m}
                          onChange={() => setSelectedMode(m)}
                          className="accent-zinc-900"
                        />
                        <span className="text-sm text-zinc-700">{MODE_LABELS[m]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white text-xs font-semibold">S</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-zinc-900 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm"
                        : "text-zinc-800"
                    }`}
                  >
                    {msg.file_name && msg.role === "user" && (
                      <div className="flex items-center gap-1.5 mb-2 text-xs text-zinc-300 bg-zinc-800 rounded-lg px-2.5 py-1.5">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        <span className="truncate max-w-[200px]">{msg.file_name}</span>
                      </div>
                    )}
                    {msg.role === "user" ? (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    ) : msg.id === "streaming" && msg.content === "" ? (
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
                      </span>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkBreaks]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 border-zinc-300 pl-3 my-2 text-zinc-500 italic">
                              {children}
                            </blockquote>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-zinc-900">{children}</strong>
                          ),
                          em: ({ children }) => <em className="italic">{children}</em>,
                          code: ({ children }) => (
                            <code className="font-mono text-xs bg-zinc-100 px-1 py-0.5 rounded">
                              {children}
                            </code>
                          ),
                          a: ({ children }) => <span className="text-zinc-700 underline underline-offset-2">{children}</span>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-zinc-100 bg-white px-4 py-3">
          <div className="max-w-2xl mx-auto">
            {quotaRemaining <= 0 ? (
              <div className="py-4 px-4 bg-zinc-50 rounded-xl border border-zinc-200 text-center space-y-3">
                <p className="text-sm text-zinc-600">
                  {quota.plan === "monthly"
                    ? "You've used all your messages for this month."
                    : "You've reached your daily limit."}
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {quota.plan === "free" && (
                    <button
                      onClick={() => startCheckout("subscribe")}
                      disabled={checkingOut !== null}
                      className="text-sm px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    >
                      {checkingOut === "subscribe" ? "Redirecting…" : "Upgrade — $49/mo"}
                    </button>
                  )}
                  <button
                    onClick={() => startCheckout("topup")}
                    disabled={checkingOut !== null}
                    className="text-sm px-4 py-2 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-50"
                  >
                    {checkingOut === "topup" ? "Redirecting…" : "Buy +100 msgs — $10"}
                  </button>
                  {quota.plan === "free" && (
                    <p className="w-full text-xs text-zinc-400 mt-1">
                      Or come back tomorrow for your daily reset.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {fileError && (
                  <p className="text-xs text-red-500 mb-1.5">{fileError}</p>
                )}
                {attachedFile && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1.5 bg-zinc-100 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 max-w-xs">
                      <svg className="w-3.5 h-3.5 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      <span className="truncate">{attachedFile.file_name}</span>
                      <button
                        onClick={() => setAttachedFile(null)}
                        className="ml-1 text-zinc-400 hover:text-zinc-700 shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 focus-within:border-zinc-400 transition-colors">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={parsingFile}
                    className="shrink-0 text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-40 mb-0.5"
                    title="Attach document (.pdf or .docx)"
                  >
                    {parsingFile ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                      </svg>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={handleFileInput}
                  />

                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder={inputDisabled ? "Loading…" : "Ask about your essay, share a draft, or brainstorm ideas…"}
                    rows={1}
                    disabled={inputDisabled}
                    className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 resize-none outline-none leading-relaxed disabled:opacity-50"
                    style={{ minHeight: "24px", maxHeight: "160px" }}
                  />

                  <button
                    onClick={send}
                    disabled={!input.trim() || inputDisabled}
                    className="shrink-0 w-7 h-7 bg-zinc-900 rounded-xl flex items-center justify-center hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all mb-0.5"
                  >
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                    </svg>
                  </button>
                </div>
                <p className="text-center text-xs text-zinc-300 mt-2">
                  Enter to send · Shift+Enter for new line · Drop .pdf or .docx to attach
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

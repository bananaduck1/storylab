"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
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

interface LabChatProps {
  userId: string;
  profile: { full_name: string; grade: string };
  conversations: Conversation[];
  activeConversationId: string;
  initialMessages: Message[];
  dailyUsed: number;
  dailyLimit: number;
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

function QuotaChip({ remaining, limit }: { remaining: number; limit: number }) {
  const color =
    remaining <= 3
      ? "bg-red-50 text-red-600 border-red-200"
      : remaining <= 10
      ? "bg-amber-50 text-amber-600 border-amber-200"
      : "bg-green-50 text-green-600 border-green-200";

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${color}`}>
      {remaining} / {limit} left
    </span>
  );
}

export default function LabChat({
  profile,
  conversations: initialConversations,
  activeConversationId,
  initialMessages,
  dailyUsed,
  dailyLimit,
}: LabChatProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConvId, setActiveConvId] = useState(activeConversationId);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);
  const [quotaRemaining, setQuotaRemaining] = useState(dailyLimit - dailyUsed);
  const [loadingConv, setLoadingConv] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFirstMount = useRef(true);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // When activeConvId changes (skip on initial mount), fetch messages
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    async function loadMessages() {
      setLoadingConv(true);
      try {
        const res = await fetch(`/api/lab/conversations/${activeConvId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } finally {
        setLoadingConv(false);
      }
    }
    loadMessages();
  }, [activeConvId]);

  async function signOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function newConversation() {
    try {
      const res = await fetch("/api/lab/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New conversation" }),
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

  async function processFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") {
      alert("Please upload a .pdf or .docx file.");
      return;
    }
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
        alert(err.error || "Failed to parse file.");
      }
    } catch {
      alert("Failed to upload file.");
    } finally {
      setParsingFile(false);
    }
  }

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
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
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== streamingId)
            .concat({
              id: crypto.randomUUID(),
              role: "assistant",
              content:
                data.error === "daily_limit_reached"
                  ? "You've reached your daily message limit. Please come back tomorrow!"
                  : "Too many requests. Please try again later.",
              file_name: null,
              created_at: new Date().toISOString(),
            })
        );
        setQuotaRemaining(0);
        return;
      }

      if (!res.ok || !res.body) {
        throw new Error("Request failed");
      }

      // Read X-RateLimit-Remaining header
      const remainingHeader = res.headers.get("X-RateLimit-Remaining");
      if (remainingHeader !== null) {
        setQuotaRemaining(parseInt(remainingHeader, 10));
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

      // Replace streaming message with a permanent one
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingId
            ? { ...m, id: crypto.randomUUID(), content: accumulated }
            : m
        )
      );

      // Refresh conversation list (titles may have changed)
      refreshConversations();
    } catch {
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== streamingId)
          .concat({
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Something went wrong. Please try again.",
            file_name: null,
            created_at: new Date().toISOString(),
          })
      );
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

  const firstName = profile.full_name.split(" ")[0];
  const inputDisabled = loading || quotaRemaining <= 0;

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
            <span className="text-sm font-semibold text-zinc-900">StoryLab</span>
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

        {/* New chat button */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={newConversation}
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
            return (
              <button
                key={conv.id}
                onClick={() => switchConversation(conv.id)}
                className={`
                  w-full text-left px-3 py-2.5 rounded-lg mb-0.5 transition-colors
                  ${isActive
                    ? "bg-white border-l-2 border-zinc-900 shadow-sm"
                    : "hover:bg-zinc-100 border-l-2 border-transparent"
                  }
                `}
              >
                <p className={`text-xs font-medium truncate ${isActive ? "text-zinc-900" : "text-zinc-700"}`}>
                  {truncateTitle(conv.title)}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {formatRelativeDate(conv.updated_at)}
                </p>
              </button>
            );
          })}
        </div>

        {/* Sidebar footer */}
        <div className="border-t border-zinc-100 px-4 py-3">
          <button
            onClick={signOut}
            className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
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
              <p className="text-xs text-zinc-400">{profile.grade} grade</p>
            </div>
          </div>
          <QuotaChip remaining={quotaRemaining} limit={dailyLimit} />
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
          ) : (
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-sm font-semibold">S</span>
                  </div>
                  <p className="text-zinc-500 text-sm">
                    Hi {firstName}! I&apos;m Sam, your essay coach. What would you like to work on today?
                  </p>
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
                    <span className="whitespace-pre-wrap">
                      {msg.content}
                      {msg.id === "streaming" && msg.content === "" && (
                        <span className="inline-flex gap-1">
                          <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
                        </span>
                      )}
                    </span>
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
              <div className="text-center py-3 text-sm text-zinc-500 bg-zinc-50 rounded-xl border border-zinc-200">
                You&apos;ve reached your daily limit. Come back tomorrow!
              </div>
            ) : (
              <>
                {/* File chip */}
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
                  {/* Paperclip button */}
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

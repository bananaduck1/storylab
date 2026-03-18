"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Notification {
  id: string;
  user_id: string;
  event_type: string;
  body: string;
  read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface NotificationBellProps {
  variant?: "dark" | "light";
}

function relativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationBell({ variant = "dark" }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setUnread(data.unread ?? 0);
      }
    } catch {
      // best-effort
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markAllRead() {
    try {
      await fetch("/api/notifications/read", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {
      // best-effort
    }
  }

  function toggleOpen() {
    setOpen((v) => !v);
  }

  // Styling based on variant
  const iconColor = variant === "dark" ? "text-zinc-400 hover:text-white" : "text-zinc-500 hover:text-zinc-900";
  const panelBg = variant === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-white border-zinc-200 text-zinc-900";
  const itemBg = variant === "dark" ? "hover:bg-zinc-700" : "hover:bg-zinc-50";
  const unreadDot = variant === "dark" ? "bg-zinc-700" : "bg-zinc-50";
  const timeColor = variant === "dark" ? "text-zinc-500" : "text-zinc-400";
  const markAllColor = variant === "dark" ? "text-zinc-400 hover:text-white" : "text-zinc-400 hover:text-zinc-700";
  const emptyColor = variant === "dark" ? "text-zinc-500" : "text-zinc-400";
  const dividerColor = variant === "dark" ? "border-zinc-700" : "border-zinc-100";

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={toggleOpen}
        className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${iconColor}`}
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 top-10 z-50 w-80 rounded-xl border shadow-lg overflow-hidden ${panelBg}`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${dividerColor}`}>
            <span className="text-xs font-semibold uppercase tracking-widest opacity-60">
              Notifications
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className={`text-xs transition-colors ${markAllColor}`}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <span className={`text-xs ${emptyColor}`}>Loading…</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className={`text-xs ${emptyColor}`}>No notifications yet.</span>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 transition-colors ${itemBg} ${!n.read ? unreadDot : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="mt-1.5 flex-none w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                    {n.read && <span className="mt-1.5 flex-none w-1.5 h-1.5" />}
                    <div className="min-w-0">
                      <p className="text-sm leading-snug">{n.body}</p>
                      <p className={`text-xs mt-0.5 ${timeColor}`}>{relativeTime(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

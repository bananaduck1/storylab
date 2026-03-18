"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";

interface Slot {
  id: string;
  offering_type: string;
  datetime: string;
  is_booked: boolean;
  created_at: string;
}

function formatET(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(isoString));
}

// Convert a "datetime-local" input value (treated as Eastern Time) to UTC ISO.
function localInputToUTCISO(value: string): string {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  const provisional = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const etFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    hourCycle: "h23",
    timeZoneName: "shortOffset",
  });
  const parts = etFormatter.formatToParts(provisional);
  const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-5";
  const offsetMatch = offsetPart.match(/GMT([+-]\d+)/);
  const offsetHours = offsetMatch ? parseInt(offsetMatch[1]) : -5;

  return new Date(Date.UTC(year, month - 1, day, hour - offsetHours, minute)).toISOString();
}

const labelClass =
  "block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-1";

export default function DashboardAvailabilityPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newDatetime, setNewDatetime] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  async function loadSlots() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/availability");
      if (!res.ok) throw new Error("Failed to load slots");
      const json = await res.json();
      setSlots(json.slots ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error loading slots");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSlots(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newDatetime || adding) return;
    setAdding(true);
    setAddError(null);
    try {
      const utcISO = localInputToUTCISO(newDatetime);
      const res = await fetch("/api/teacher/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datetime: utcISO, offering_type: "consultation" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAddError(json.error ?? "Failed to add slot");
      } else {
        setNewDatetime("");
        startTransition(() => { loadSlots(); });
      }
    } catch {
      setAddError("Network error");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this slot?")) return;
    try {
      const res = await fetch(`/api/teacher/availability?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        alert(json.error ?? "Failed to delete");
      } else {
        setSlots((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      alert("Network error");
    }
  }

  async function handleToggleBooked(slot: Slot) {
    try {
      const res = await fetch("/api/teacher/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: slot.id, is_booked: !slot.is_booked }),
      });
      if (!res.ok) {
        const json = await res.json();
        alert(json.error ?? "Failed to update");
      } else {
        setSlots((prev) =>
          prev.map((s) => (s.id === slot.id ? { ...s, is_booked: !s.is_booked } : s))
        );
      }
    } catch {
      alert("Network error");
    }
  }

  const now = new Date().toISOString();
  const upcoming = slots.filter((s) => s.datetime >= now).sort((a, b) => a.datetime.localeCompare(b.datetime));
  const past = slots.filter((s) => s.datetime < now).sort((a, b) => b.datetime.localeCompare(a.datetime));

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              ← Dashboard
            </Link>
            <span className="text-zinc-700">·</span>
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Availability</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Availability</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your bookable time slots. Students can book these from your storefront.
            All times displayed in ET.
          </p>
        </div>

        {/* Add slot form */}
        <form
          onSubmit={handleAdd}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
        >
          <p className="text-sm font-semibold text-zinc-300 mb-4">Add a slot</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className={labelClass}>Date &amp; time (Eastern Time)</label>
              <input
                type="datetime-local"
                required
                value={newDatetime}
                onChange={(e) => setNewDatetime(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700 transition"
              />
              <p className="mt-1 text-xs text-zinc-600">
                Enter the time as it should appear in ET (e.g. 10:00 = 10 AM ET).
              </p>
            </div>
            <button
              type="submit"
              disabled={adding}
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-50 transition"
            >
              {adding ? "Adding…" : "Add slot"}
            </button>
          </div>
          {addError && <p className="mt-3 text-sm text-red-400">{addError}</p>}
        </form>

        {/* Upcoming slots */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 mb-4">
            Upcoming ({upcoming.length})
          </h2>

          {loading && <p className="text-sm text-zinc-500">Loading…</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!loading && upcoming.length === 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 px-6 py-8 text-center">
              <p className="text-sm text-zinc-500">No upcoming slots. Add one above.</p>
            </div>
          )}

          {!loading && upcoming.length > 0 && (
            <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 overflow-hidden">
              {upcoming.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex-shrink-0 h-2 w-2 rounded-full ${
                        slot.is_booked ? "bg-amber-400" : "bg-emerald-400"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {formatET(slot.datetime)}
                      </p>
                      <p className="text-xs text-zinc-500">{slot.offering_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                        slot.is_booked
                          ? "bg-amber-950/40 text-amber-400 border-amber-800/50"
                          : "bg-emerald-950/40 text-emerald-400 border-emerald-800/50"
                      }`}
                    >
                      {slot.is_booked ? "Booked" : "Available"}
                    </span>
                    <button
                      onClick={() => handleToggleBooked(slot)}
                      className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
                    >
                      {slot.is_booked ? "Mark available" : "Mark booked"}
                    </button>
                    {!slot.is_booked && (
                      <button
                        onClick={() => handleDelete(slot.id)}
                        className="text-xs text-red-500 hover:text-red-400 transition-colors"
                        aria-label="Delete slot"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past slots */}
        {past.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600 mb-4">
              Past ({past.length})
            </h2>
            <div className="divide-y divide-zinc-800/50 rounded-xl border border-zinc-800/50 overflow-hidden opacity-60">
              {past.slice(0, 10).map((slot) => (
                <div key={slot.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex-shrink-0 h-1.5 w-1.5 rounded-full ${
                        slot.is_booked ? "bg-amber-600" : "bg-zinc-600"
                      }`}
                    />
                    <p className="text-sm text-zinc-400">
                      {formatET(slot.datetime)} &middot;{" "}
                      <span className="text-zinc-600">{slot.is_booked ? "Was booked" : "Unfilled"}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

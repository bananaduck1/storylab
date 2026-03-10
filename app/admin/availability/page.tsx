"use client";

import { useEffect, useState, useTransition } from "react";

interface Slot {
  id: string;
  offering_type: string;
  datetime: string;
  is_booked: boolean;
  created_at: string;
}

const OFFERING_TYPES = ["consultation"];

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

// Convert local datetime-local input value to UTC ISO string
// The input value is in local browser time; we want to treat it as ET
function localInputToUTCISO(value: string): string {
  // value is like "2026-03-15T10:00"
  // We interpret this as America/New_York time
  // Build date assuming ET by using Intl to determine offset
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  // Create a date in ET by using a known trick: format a UTC date in ET to find offset
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

  // Adjust: the provisional UTC date, when rendered in ET, is offset hours from UTC
  // So actual UTC = the intended ET time minus the offset
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour - offsetHours, minute));
  return utcDate.toISOString();
}

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [newDatetime, setNewDatetime] = useState("");
  const [newOffering, setNewOffering] = useState("consultation");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  async function loadSlots() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/availability");
      if (!res.ok) throw new Error("Failed to load slots");
      const json = await res.json();
      setSlots(json.slots ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error loading slots");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlots();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newDatetime || adding) return;
    setAdding(true);
    setAddError(null);

    try {
      const utcISO = localInputToUTCISO(newDatetime);
      const res = await fetch("/api/admin/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datetime: utcISO, offering_type: newOffering }),
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
      const res = await fetch(`/api/admin/availability?id=${id}`, { method: "DELETE" });
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
      const res = await fetch("/api/admin/availability", {
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

  // Group upcoming vs past
  const now = new Date().toISOString();
  const upcoming = slots.filter((s) => s.datetime >= now).sort((a, b) => a.datetime.localeCompare(b.datetime));
  const past = slots.filter((s) => s.datetime < now).sort((a, b) => b.datetime.localeCompare(a.datetime));

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Availability</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Manage bookable time slots. All times displayed in ET.
      </p>

      {/* ── Add slot form ────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleAdd}
        className="mt-8 rounded-xl border border-zinc-200 bg-white p-6"
      >
        <p className="text-sm font-semibold text-zinc-700 mb-4">Add a slot</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-zinc-500 mb-1">
              Date &amp; time (Eastern Time)
            </label>
            <input
              type="datetime-local"
              required
              value={newDatetime}
              onChange={(e) => setNewDatetime(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition"
            />
            <p className="mt-1 text-xs text-zinc-400">
              Enter the time as it should appear in ET (e.g. 10:00 = 10 AM ET).
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Offering</label>
            <select
              value={newOffering}
              onChange={(e) => setNewOffering(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 transition"
            >
              {OFFERING_TYPES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={adding}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 transition"
          >
            {adding ? "Adding…" : "Add slot"}
          </button>
        </div>
        {addError && <p className="mt-3 text-sm text-red-600">{addError}</p>}
      </form>

      {/* ── Upcoming slots ───────────────────────────────────────────────────── */}
      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400 mb-4">
          Upcoming ({upcoming.length})
        </h2>

        {loading && <p className="text-sm text-zinc-400">Loading…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && upcoming.length === 0 && (
          <p className="text-sm text-zinc-400">No upcoming slots. Add one above.</p>
        )}

        {!loading && upcoming.length > 0 && (
          <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white overflow-hidden">
            {upcoming.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`flex-shrink-0 h-2 w-2 rounded-full ${
                      slot.is_booked ? "bg-amber-400" : "bg-emerald-400"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {formatET(slot.datetime)}
                    </p>
                    <p className="text-xs text-zinc-400">{slot.offering_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      slot.is_booked
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {slot.is_booked ? "Booked" : "Available"}
                  </span>
                  <button
                    onClick={() => handleToggleBooked(slot)}
                    className="text-xs text-zinc-400 hover:text-zinc-700 underline underline-offset-2 transition-colors"
                  >
                    {slot.is_booked ? "Mark available" : "Mark booked"}
                  </button>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    className="text-xs text-red-400 hover:text-red-700 transition-colors"
                    aria-label="Delete slot"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Past slots ───────────────────────────────────────────────────────── */}
      {past.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400 mb-4">
            Past ({past.length})
          </h2>
          <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-100 bg-zinc-50 overflow-hidden">
            {past.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between gap-4 px-5 py-4 opacity-60"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex-shrink-0 h-2 w-2 rounded-full ${
                      slot.is_booked ? "bg-amber-300" : "bg-zinc-300"
                    }`}
                  />
                  <div>
                    <p className="text-sm text-zinc-600">{formatET(slot.datetime)}</p>
                    <p className="text-xs text-zinc-400">
                      {slot.offering_type} &middot; {slot.is_booked ? "Was booked" : "Unfilled"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(slot.id)}
                  className="text-xs text-red-400 hover:text-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

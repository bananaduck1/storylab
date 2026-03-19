"use client";

import { useState } from "react";

interface RevenueRow {
  teacher_id: string;
  teacher_name: string;
  stripe_account_id: string;
  platform_fee_cents: number;
  booking_count: number;
}

export default function RevenueTable() {
  const [rows, setRows] = useState<RevenueRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRevenue() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/revenue");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load revenue data");
        return;
      }
      setRows(data.rows);
    } catch {
      setError("Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
            Platform Revenue
          </p>
          <p className="text-sm text-zinc-500">20% platform fee per teacher booking</p>
        </div>
        <button
          onClick={loadRevenue}
          disabled={loading}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
        >
          {loading ? "Loading…" : rows !== null ? "Refresh" : "Load revenue data"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}

      {rows !== null && (
        rows.length === 0 ? (
          <p className="text-sm text-zinc-400 mt-4">No Connect bookings yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left pb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">Teacher</th>
                  <th className="text-right pb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">Bookings</th>
                  <th className="text-right pb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">Platform Fee</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.stripe_account_id} className="border-b border-zinc-50">
                    <td className="py-2.5 text-zinc-900 font-medium">{row.teacher_name}</td>
                    <td className="py-2.5 text-right text-zinc-500">{row.booking_count}</td>
                    <td className="py-2.5 text-right text-zinc-900 font-semibold">
                      ${(row.platform_fee_cents / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-3 text-xs text-zinc-400" colSpan={2}>Total platform fees</td>
                  <td className="pt-3 text-right font-bold text-zinc-900">
                    ${(rows.reduce((s, r) => s + r.platform_fee_cents, 0) / 100).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )
      )}
    </div>
  );
}

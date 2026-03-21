"use client";

import { useState } from "react";

type PipelineStage =
  | "prospect"
  | "demo_scheduled"
  | "proposal_sent"
  | "negotiating"
  | "closed_won"
  | "closed_lost";

type PricingTier = "standard" | "enterprise" | "pilot";

interface OrgSubscription {
  status: string;
  current_period_end: string | null;
}

interface Org {
  id: string;
  name: string;
  slug: string;
  contact_email: string | null;
  pipeline_stage: PipelineStage;
  pipeline_notes: string | null;
  last_contacted_at: string | null;
  pricing_tier: PricingTier;
  deal_notes: string | null;
  created_at: string;
  org_subscriptions: OrgSubscription | OrgSubscription[] | null;
}

// ── Stage display config ──────────────────────────────────────────────────
const STAGE_CONFIG: Record<PipelineStage, { label: string; bg: string; text: string }> = {
  prospect:        { label: "Prospect",        bg: "bg-[#DEEEE9]",     text: "text-[#2C4A3E]" },
  demo_scheduled:  { label: "Demo scheduled",  bg: "bg-blue-100",       text: "text-blue-800" },
  proposal_sent:   { label: "Proposal sent",   bg: "bg-amber-100",      text: "text-amber-800" },
  negotiating:     { label: "Negotiating",     bg: "bg-purple-100",     text: "text-purple-800" },
  closed_won:      { label: "Closed won",      bg: "bg-[#2C4A3E]",     text: "text-[#DEEEE9]" },
  closed_lost:     { label: "Closed lost",     bg: "bg-zinc-100",       text: "text-zinc-500" },
};

const ALL_STAGES: PipelineStage[] = [
  "prospect",
  "demo_scheduled",
  "proposal_sent",
  "negotiating",
  "closed_won",
  "closed_lost",
];

const TIER_LABELS: Record<PricingTier, string> = {
  standard:   "Standard",
  enterprise: "Enterprise",
  pilot:      "Pilot",
};

function StageBadge({ stage }: { stage: PipelineStage }) {
  const cfg = STAGE_CONFIG[stage] ?? STAGE_CONFIG.prospect;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function isInactive(lastContactedAt: string | null): boolean {
  if (!lastContactedAt) return false; // null → no alert
  const diff = Date.now() - new Date(lastContactedAt).getTime();
  return diff > 60 * 24 * 60 * 60 * 1000; // 60 days
}

function subStatus(org: Org): string {
  const sub = Array.isArray(org.org_subscriptions)
    ? org.org_subscriptions[0]
    : org.org_subscriptions;
  return sub?.status ?? "—";
}

// ── New org form ──────────────────────────────────────────────────────────
function NewOrgForm({ onCreated }: { onCreated: (org: Org) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setErr(null);

    try {
      const res = await fetch("/api/admin/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), contact_email: email.trim() || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const org = await res.json();
      onCreated(org);
      setName("");
      setEmail("");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-3 p-4 border-b border-zinc-200">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500">Org name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Exeter Academy"
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/30"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-500">Contact email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admissions@exeter.edu"
          type="email"
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/30"
        />
      </div>
      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="rounded bg-[#2C4A3E] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#3a5e50] disabled:opacity-50"
      >
        {saving ? "Adding…" : "Add prospect"}
      </button>
      {err && <p className="text-xs text-red-600">{err}</p>}
    </form>
  );
}

// ── Stage dropdown (inline PATCH) ─────────────────────────────────────────
function StageDropdown({
  orgId,
  current,
  onChange,
}: {
  orgId: string;
  current: PipelineStage;
  onChange: (next: PipelineStage) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function handleChange(next: PipelineStage) {
    setSaving(true);
    try {
      await fetch("/api/admin/pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orgId, pipeline_stage: next }),
      });
      onChange(next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={current}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value as PipelineStage)}
      className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]/30 disabled:opacity-60"
    >
      {ALL_STAGES.map((s) => (
        <option key={s} value={s}>
          {STAGE_CONFIG[s].label}
        </option>
      ))}
    </select>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function PipelineClient({ initialOrgs }: { initialOrgs: Org[] }) {
  const [orgs, setOrgs] = useState<Org[]>(initialOrgs);

  function updateStage(id: string, stage: PipelineStage) {
    setOrgs((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, pipeline_stage: stage, last_contacted_at: new Date().toISOString() }
          : o
      )
    );
  }

  return (
    <div className="p-6" style={{ fontFamily: "var(--font-cooper)" }}>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-900">B2B Pipeline</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {orgs.length} org{orgs.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* New org form */}
      <div className="rounded-lg border border-zinc-200 bg-white mb-6 shadow-sm overflow-hidden">
        <NewOrgForm onCreated={(org) => setOrgs((prev) => [org, ...prev])} />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#2C4A3E] text-[#DEEEE9]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Last contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  Contact
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orgs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-zinc-400"
                  >
                    No organizations yet. Add your first prospect above.
                  </td>
                </tr>
              ) : (
                orgs.map((org) => {
                  const inactive = isInactive(org.last_contacted_at);
                  return (
                    <tr
                      key={org.id}
                      className="hover:bg-zinc-50 transition-colors"
                    >
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900">{org.name}</div>
                        {org.pipeline_notes && (
                          <div className="text-xs text-zinc-400 mt-0.5 truncate max-w-[200px]">
                            {org.pipeline_notes}
                          </div>
                        )}
                      </td>

                      {/* Stage — inline dropdown */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StageBadge stage={org.pipeline_stage} />
                          <StageDropdown
                            orgId={org.id}
                            current={org.pipeline_stage}
                            onChange={(s) => updateStage(org.id, s)}
                          />
                        </div>
                      </td>

                      {/* Tier */}
                      <td className="px-4 py-3 text-zinc-600">
                        {TIER_LABELS[org.pricing_tier] ?? "Standard"}
                      </td>

                      {/* Subscription status */}
                      <td className="px-4 py-3 text-zinc-500 capitalize">
                        {subStatus(org)}
                      </td>

                      {/* Last contact */}
                      <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                        {org.last_contacted_at ? (
                          <span className={inactive ? "text-amber-600" : ""}>
                            {inactive && <span className="mr-1">⚠️</span>}
                            {new Date(org.last_contacted_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>

                      {/* Contact email */}
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        {org.contact_email ?? <span className="text-zinc-300">—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

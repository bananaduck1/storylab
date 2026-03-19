"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type Tab = "overview" | "members" | "analytics" | "import" | "billing";

interface Analytics {
  student_count: number;
  session_count_30d: number;
  lab_messages_30d: number;
  students: Array<{
    id: string;
    name: string;
    org_membership_status: string;
    last_active: string | null;
    created_at: string;
  }>;
}

interface Members {
  teachers: Array<{
    id: string;
    role: string;
    joined_at: string;
    teachers: { id: string; name: string; email: string; slug: string };
  }>;
  students: Array<{
    id: string;
    name: string;
    org_membership_status: string;
    created_at: string;
  }>;
}

export default function OrgAdminPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("overview");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [members, setMembers] = useState<Members | null>(null);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; failed: { email: string; reason: string }[] } | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [subscriptionStatus] = useState<string>("inactive");

  useEffect(() => {
    fetch(`/api/org/${slug}/info`).then(r => r.json()).then(d => setOrgName(d.name ?? slug));
    fetch(`/api/org/${slug}/analytics`).then(r => r.json()).then(setAnalytics).catch(() => {});
    fetch(`/api/org/${slug}/members`).then(r => r.json()).then(setMembers).catch(() => {});
    // Check if just subscribed
    if (searchParams.get("subscribed") === "true") setTab("billing");
  }, [slug, searchParams]);

  async function handleApprove(studentId: string) {
    await fetch(`/api/org/${slug}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, action: "approve" }),
    });
    setMembers(prev => prev ? {
      ...prev,
      students: prev.students.map(s => s.id === studentId ? { ...s, org_membership_status: "active" } : s),
    } : prev);
  }

  async function handleReject(studentId: string) {
    await fetch(`/api/org/${slug}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, action: "reject" }),
    });
    setMembers(prev => prev ? {
      ...prev,
      students: prev.students.filter(s => s.id !== studentId),
    } : prev);
  }

  async function handleImport() {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch(`/api/org/${slug}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText }),
      });
      const data = await res.json();
      setImportResult(data);
    } finally {
      setImporting(false);
    }
  }

  async function handleSubscribe() {
    setSubscribing(true);
    try {
      const res = await fetch("/api/org/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_slug: slug }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setSubscribing(false);
    }
  }

  function formatLastActive(date: string | null) {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  }

  const pendingStudents = members?.students.filter(s => s.org_membership_status === "pending") ?? [];
  const activeStudents = members?.students.filter(s => s.org_membership_status === "active") ?? [];

  const navItems: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "members", label: `Members${pendingStudents.length > 0 ? ` (${pendingStudents.length} pending)` : ""}` },
    { id: "analytics", label: "Analytics" },
    { id: "import", label: "Import" },
    { id: "billing", label: "Billing" },
  ];

  const style = { fontFamily: "var(--font-cooper)" };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 bg-[#DEEEE9] border-r border-[#C0D9CB] flex flex-col pt-8">
        <div className="px-5 mb-8">
          <p className="text-xs uppercase tracking-[0.12em] text-[#2C4A3E]/55 mb-1" style={style}>Admin</p>
          <h2 className="text-base font-bold text-[#1A2E26] leading-tight" style={style}>{orgName || slug}</h2>
        </div>
        <nav className="flex flex-col gap-0.5 px-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`text-left px-3 py-2 rounded-[3px] text-sm transition-colors ${
                tab === item.id
                  ? "bg-[#2C4A3E] text-white font-medium"
                  : "text-[#1A2E26]/70 hover:bg-[#C0D9CB]/40"
              }`}
              style={style}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto px-5 pb-6">
          <a href={`/org/${slug}`} className="text-xs text-[#2C4A3E]/60 hover:text-[#2C4A3E] transition-colors" style={style}>
            &larr; View community
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-8 py-10 max-w-4xl">

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div className="space-y-8">
            <h1 className="text-2xl font-bold text-[#1A2E26]" style={style}>Overview</h1>
            {/* 3-stat bar */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "students", value: analytics?.student_count ?? "\u2014" },
                { label: "sessions (30d)", value: analytics?.session_count_30d ?? "\u2014" },
                { label: "AI messages (30d)", value: analytics?.lab_messages_30d ?? "\u2014" },
              ].map(stat => (
                <div key={stat.label} className="bg-white border border-[#C0D9CB] rounded-[4px] p-5">
                  <div
                    className="text-4xl font-black text-[#1A2E26]"
                    style={style}
                    aria-label={`${stat.value} ${stat.label}`}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs uppercase tracking-[0.12em] text-[#1A2E26]/50 mt-1" style={style}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            {/* Recent students */}
            <div>
              <h2 className="text-sm uppercase tracking-[0.12em] text-[#1A2E26]/50 mb-3" style={style}>YOUR STUDENTS</h2>
              {(analytics?.students.filter(s => s.org_membership_status === "active").length ?? 0) === 0 ? (
                <div className="bg-[#DEEEE9] rounded-[4px] p-8 text-center space-y-3">
                  <p className="text-[#1A2E26] font-medium" style={style}>Your StoryLab community is ready.</p>
                  <p className="text-[#1A2E26]/60 text-sm" style={style}>
                    Share your invite code with teachers and students to get started.
                  </p>
                  <button
                    onClick={() => setTab("import")}
                    className="mt-2 bg-[#2C4A3E] text-white px-5 py-2 rounded-[3px] text-sm hover:bg-[#3A6054] transition-colors"
                    style={style}
                  >
                    Import students
                  </button>
                </div>
              ) : (
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b border-[#C0D9CB]">
                      <th scope="col" className="text-left py-2 text-[#1A2E26]/50 font-medium" style={style}>Name</th>
                      <th scope="col" className="text-right py-2 text-[#1A2E26]/50 font-medium" style={style}>Last active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.students.filter(s => s.org_membership_status === "active").map(s => {
                      const diffDays = s.last_active
                        ? Math.floor((Date.now() - new Date(s.last_active).getTime()) / (1000 * 60 * 60 * 24))
                        : 999;
                      return (
                        <tr key={s.id} className="border-b border-[#C0D9CB]/50">
                          <td className="py-2.5 text-[#1A2E26]" style={style}>{s.name}</td>
                          <td
                            className={`py-2.5 text-right ${diffDays > 7 ? "text-amber-600" : "text-[#1A2E26]/60"}`}
                            style={style}
                          >
                            {formatLastActive(s.last_active)}
                            {diffDays > 7 && (
                              <span
                                className="ml-1.5 inline-block w-2 h-2 rounded-full bg-amber-500"
                                title="Inactive for over 7 days"
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            {/* Quick actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setTab("members")}
                className="border border-[#C0D9CB] text-[#2C4A3E] px-4 py-2 rounded-[3px] text-sm hover:border-[#2C4A3E] transition-colors"
                style={style}
              >
                + Invite teacher
              </button>
              <button
                onClick={() => setTab("import")}
                className="border border-[#C0D9CB] text-[#2C4A3E] px-4 py-2 rounded-[3px] text-sm hover:border-[#2C4A3E] transition-colors"
                style={style}
              >
                + Import students CSV
              </button>
            </div>
          </div>
        )}

        {/* MEMBERS TAB */}
        {tab === "members" && (
          <div className="space-y-8">
            <h1 className="text-2xl font-bold text-[#1A2E26]" style={style}>Members</h1>
            {/* Teachers */}
            <div>
              <h2 className="text-sm uppercase tracking-[0.12em] text-[#1A2E26]/50 mb-3" style={style}>TEACHERS</h2>
              {(members?.teachers.length ?? 0) === 0 ? (
                <p className="text-[#1A2E26]/60 text-sm" style={style}>No teachers yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#C0D9CB]">
                      <th scope="col" className="text-left py-2 text-[#1A2E26]/50 font-medium" style={style}>Name</th>
                      <th scope="col" className="text-left py-2 text-[#1A2E26]/50 font-medium" style={style}>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members?.teachers.map(ot => (
                      <tr key={ot.id} className="border-b border-[#C0D9CB]/50">
                        <td className="py-2.5 text-[#1A2E26]" style={style}>{(ot.teachers as any)?.name}</td>
                        <td className="py-2.5 text-[#1A2E26]/60 capitalize" style={style}>{ot.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {/* Students — Active / Pending */}
            <div>
              <div className="flex gap-1 mb-4">
                <span className="text-sm font-medium text-[#1A2E26] border-b-2 border-[#2C4A3E] pb-1 pr-2" style={style}>
                  Active ({activeStudents.length})
                </span>
                {pendingStudents.length > 0 && (
                  <span className="text-sm text-[#1A2E26]/50 pb-1 px-2" style={style}>
                    Pending ({pendingStudents.length})
                  </span>
                )}
              </div>
              {/* Pending students first */}
              {pendingStudents.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs uppercase tracking-[0.12em] text-amber-600 mb-3" style={style}>AWAITING APPROVAL</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#C0D9CB]">
                        <th scope="col" className="text-left py-2 text-[#1A2E26]/50 font-medium" style={style}>Name</th>
                        <th scope="col" className="text-right py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {pendingStudents.map(s => (
                        <tr key={s.id} className="border-b border-[#C0D9CB]/50">
                          <td className="py-2.5 text-[#1A2E26]" style={style}>{s.name}</td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => handleApprove(s.id)}
                              className="text-[#2C4A3E] text-xs font-medium hover:underline mr-3"
                              style={style}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(s.id)}
                              className="text-red-500 text-xs hover:underline"
                              style={style}
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Active students */}
              {activeStudents.length === 0 ? (
                <p className="text-[#1A2E26]/60 text-sm" style={style}>No active students yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {activeStudents.map(s => (
                      <tr key={s.id} className="border-b border-[#C0D9CB]/50">
                        <td className="py-2.5 text-[#1A2E26]" style={style}>{s.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {tab === "analytics" && (
          <div className="space-y-8">
            <h1 className="text-2xl font-bold text-[#1A2E26]" style={style}>Analytics</h1>
            <p className="text-sm text-[#1A2E26]/50" style={style}>Last 30 days</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "students", value: analytics?.student_count ?? "\u2014" },
                { label: "sessions", value: analytics?.session_count_30d ?? "\u2014" },
                { label: "AI messages", value: analytics?.lab_messages_30d ?? "\u2014" },
              ].map(stat => (
                <div key={stat.label} className="bg-white border border-[#C0D9CB] rounded-[4px] p-5">
                  <div className="text-4xl font-black text-[#1A2E26]" style={style}>{stat.value}</div>
                  <div className="text-xs uppercase tracking-[0.12em] text-[#1A2E26]/50 mt-1" style={style}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IMPORT TAB */}
        {tab === "import" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#1A2E26]" style={style}>Import Students</h1>
            <p className="text-sm text-[#1A2E26]/60" style={style}>
              Paste a CSV with columns:{" "}
              <code className="font-mono text-xs bg-[#DEEEE9] px-1.5 py-0.5 rounded">name,email</code>.
              Include a header row. Students with existing accounts will be added to your org automatically.
            </p>
            <div>
              <label htmlFor="csv_input" className="block text-sm text-[#1A2E26]/60 mb-2" style={style}>
                CSV content
              </label>
              <textarea
                id="csv_input"
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder={"name,email\nMaya Chen,maya@school.edu\nJames Park,james@school.edu"}
                rows={10}
                className="w-full border border-[#C0D9CB] rounded-[4px] px-4 py-3 text-sm text-[#1A2E26] font-mono bg-white focus:outline-none focus:border-[#2C4A3E] transition-colors resize-none"
              />
            </div>
            <button
              onClick={handleImport}
              disabled={importing || !csvText.trim()}
              className="bg-[#2C4A3E] text-white px-6 py-2.5 rounded-[3px] text-sm font-medium hover:bg-[#3A6054] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={style}
            >
              {importing ? "Importing\u2026" : "Import students"}
            </button>
            {importResult && (
              <div className="border border-[#C0D9CB] rounded-[4px] p-4 space-y-2">
                <p className="text-sm font-medium text-[#1A2E26]" style={style}>
                  {importResult.ok} student{importResult.ok !== 1 ? "s" : ""} invited successfully.
                </p>
                {importResult.failed.length > 0 && (
                  <div>
                    <p className="text-sm text-red-600 mb-1" style={style}>{importResult.failed.length} failed:</p>
                    {importResult.failed.map((f, i) => (
                      <p key={i} className="text-xs text-red-500 font-mono">{f.email}: {f.reason}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* BILLING TAB */}
        {tab === "billing" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#1A2E26]" style={style}>Billing</h1>
            <div className="border border-[#C0D9CB] rounded-[4px] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    subscriptionStatus === "active"
                      ? "bg-green-100 text-green-800"
                      : subscriptionStatus === "past_due"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-[#DEEEE9] text-[#1A2E26]/60"
                  }`}
                  style={style}
                >
                  {subscriptionStatus === "active"
                    ? "Active \u2713"
                    : subscriptionStatus === "past_due"
                    ? "Past due \u26a0"
                    : "Not subscribed"}
                </span>
              </div>
              <p className="text-sm text-[#1A2E26]/60" style={style}>
                Your StoryLab subscription covers platform access for your school community — AI coach, tutors, and resources.
              </p>
              {subscriptionStatus !== "active" && (
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="bg-[#2C4A3E] text-white px-6 py-2.5 rounded-[3px] text-sm font-medium hover:bg-[#3A6054] transition-colors disabled:opacity-50"
                  style={style}
                >
                  {subscribing ? "Redirecting\u2026" : "Activate subscription \u2192"}
                </button>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

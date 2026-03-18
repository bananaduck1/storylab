"use client";

import { useState } from "react";
import Link from "next/link";
import NotificationBell from "@/app/_components/NotificationBell";

interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string | null;
}

interface Student {
  id: string;
  name: string;
  grade: string | null;
  development_stage: string;
  email: string | null;
  invited_at: string | null;
}

interface Session {
  id: string;
  student_id: string;
  studentName: string;
  date: string;
  session_type: string;
  status: string;
  scheduled_at: string | null;
}

const STAGE_LABELS: Record<string, string> = {
  exploration: "Exploration",
  narrative_dev: "Narrative Dev",
  application_ready: "App Ready",
  post_admissions: "Post-Admissions",
};

const SESSION_TYPE_LABELS: Record<string, string> = {
  essay_work: "Essay Work",
  generative: "Generative",
  parent_call: "Parent Call",
};

export default function TeacherDashboard({
  teacher,
  students,
  recentSessions,
  showWizardBanner,
  showLearnerBanner = false,
  isFounder = false,
}: {
  teacher: Teacher;
  students: Student[];
  recentSessions: Session[];
  showWizardBanner: boolean;
  /** True when this teacher hasn't started their own /lab student profile yet. */
  showLearnerBanner?: boolean;
  /** True for the platform founder — shows Platform link in role switcher. */
  isFounder?: boolean;
}) {
  const [inviting, setInviting] = useState<string | null>(null);
  const [inviteStatus, setInviteStatus] = useState<Record<string, "sending" | "sent" | "error">>({});

  const firstName = teacher.name.split(" ")[0];

  async function handleInvite(studentId: string) {
    setInviting(studentId);
    setInviteStatus((s) => ({ ...s, [studentId]: "sending" }));
    try {
      const res = await fetch("/api/teacher/invite-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId }),
      });
      setInviteStatus((s) => ({ ...s, [studentId]: res.ok ? "sent" : "error" }));
    } catch {
      setInviteStatus((s) => ({ ...s, [studentId]: "error" }));
    } finally {
      setInviting(null);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">StoryLab</span>
            {/* Role context switcher — always visible for teachers; Teaching is active context */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-700">·</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium">Teaching</span>
              <Link
                href="/lab"
                className="text-xs px-2 py-0.5 rounded-full text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400 transition-colors"
              >
                Learning
              </Link>
              {isFounder && (
                <Link
                  href="/admin/dashboard"
                  className="text-xs px-2 py-0.5 rounded-full text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400 transition-colors"
                >
                  Platform
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell variant="dark" />
            <Link href="/dashboard/settings" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Settings
            </Link>
            <span className="text-xs text-zinc-600">{teacher.email}</span>
          </div>
        </div>
      </div>

      {/* Lifelong learner banner — shown to teachers who haven't started their own /lab profile */}
      {showLearnerBanner && (
        <div className="border-b border-zinc-800 bg-zinc-900/40 px-6 py-3">
          <div className="mx-auto max-w-5xl flex items-center justify-between gap-4">
            <p className="text-sm text-zinc-400">
              StoryLab is for lifelong learners — even teachers. Start your own learning journey.
            </p>
            <Link
              href="/lab/onboarding"
              className="shrink-0 text-xs font-medium text-zinc-300 hover:text-white underline underline-offset-2 transition-colors"
            >
              Open Learning Lab →
            </Link>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        {/* Wizard banner */}
        {showWizardBanner && (
          <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-amber-200">Complete your teaching profile</p>
              <p className="text-xs text-amber-400/70 mt-0.5">Your AI isn't fully configured yet. Answer 5 questions to activate it for your students.</p>
            </div>
            <Link
              href="/dashboard/settings"
              className="shrink-0 rounded-lg bg-amber-900/40 border border-amber-700/40 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-900/60 transition-colors"
            >
              Set up profile →
            </Link>
          </div>
        )}

        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-semibold text-white">Hey, {firstName}</h1>
          {teacher.subject && (
            <p className="text-sm text-zinc-500 mt-1">{teacher.subject}</p>
          )}
        </div>

        {/* Students */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
              Students ({students.length})
            </h2>
          </div>

          {students.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-10 text-center">
              <p className="text-zinc-400 text-sm">No students yet.</p>
              <p className="text-zinc-600 text-xs mt-1">Add a student from your admin dashboard and assign them to your account.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student) => {
                const status = inviteStatus[student.id];
                return (
                  <div
                    key={student.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{student.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {student.grade ? `Grade ${student.grade}` : "Grade —"}
                          {" · "}
                          {STAGE_LABELS[student.development_stage] ?? student.development_stage}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {student.email && !student.invited_at && (
                        <button
                          onClick={() => handleInvite(student.id)}
                          disabled={!!inviting || status === "sent"}
                          className="text-xs text-zinc-400 hover:text-white disabled:opacity-50 transition-colors"
                        >
                          {status === "sending" ? "Sending…" : status === "sent" ? "Invited ✓" : status === "error" ? "Failed — retry" : "Invite to /lab"}
                        </button>
                      )}
                      {student.invited_at && !status && (
                        <span className="text-xs text-zinc-600">Invited</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-4">
              Recent Sessions
            </h2>
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/session/${session.id}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-3.5 hover:border-zinc-700 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm text-white truncate">{session.studentName}</span>
                    <span className="text-xs text-zinc-600">{SESSION_TYPE_LABELS[session.session_type] ?? session.session_type}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-zinc-600">
                      {session.scheduled_at
                        ? new Date(session.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : session.date
                          ? new Date(session.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : "—"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      session.status === "completed" ? "bg-zinc-800 text-zinc-400" :
                      session.status === "scheduled" ? "bg-emerald-950/40 text-emerald-400" :
                      "bg-zinc-800 text-zinc-500"
                    }`}>
                      {session.status ?? "completed"}
                    </span>
                    <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors text-sm">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

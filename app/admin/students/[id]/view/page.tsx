import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCallerUser, ADMIN_EMAIL } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  essay_mode: string | null;
}

interface Message {
  id: string;
  role: string;
  content: string;
  file_name: string | null;
  created_at: string;
}

interface StudentProfile {
  user_id: string;
  full_name: string;
  grade: string | null;
  portrait_notes: string | null;
}

function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const MODE_LABELS: Record<string, string> = {
  common_app: "Common App",
  transfer: "Transfer",
  academic: "Academic",
  supplemental: "Supplemental",
};


export default async function StudentLabViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studentId } = await params;

  const user = await getCallerUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    redirect("/login");
  }

  const db = getSupabase();

  // Fetch student record to get user_id and name
  const { data: student, error: studentErr } = await db
    .from("students")
    .select("id, name, user_id")
    .eq("id", studentId)
    .single();

  if (studentErr || !student) {
    notFound();
  }

  if (!student.user_id) {
    return (
      <div className="min-h-screen bg-white px-8 py-8 max-w-4xl mx-auto">
        <Link href="/admin/dashboard" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          ← Back to admin
        </Link>
        <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
          <p className="text-zinc-500 text-sm">
            {student.name} has not linked a /lab account yet.
          </p>
          <p className="text-zinc-400 text-xs mt-1">
            Send them an invite from the admin dashboard so they can claim their account.
          </p>
        </div>
      </div>
    );
  }

  const labUserId = student.user_id as string;

  // Parallel: fetch profile, conversations, and log the shadow view audit notification
  const [profileRes, convsRes] = await Promise.all([
    db
      .from("student_profiles")
      .select("user_id, full_name, grade, portrait_notes")
      .eq("user_id", labUserId)
      .single(),
    db
      .from("conversations")
      .select("id, title, updated_at, essay_mode")
      .eq("user_id", labUserId)
      .order("updated_at", { ascending: false })
      .limit(10),
  ]);

  const profile = profileRes.data as StudentProfile | null;
  const conversations = (convsRes.data ?? []) as Conversation[];

  // Fetch messages from most recent conversation (last 50)
  let recentMessages: Message[] = [];
  if (conversations.length > 0) {
    const { data: msgs } = await db
      .from("conversation_messages")
      .select("id, role, content, file_name, created_at")
      .eq("conversation_id", conversations[0].id)
      .order("created_at", { ascending: true })
      .limit(50);
    recentMessages = (msgs ?? []) as Message[];
  }

  // Audit log: insert notification for the admin
  await db.from("notifications").insert({
    user_id: user.id,
    event_type: "shadow_view",
    body: `Viewed /lab as ${student.name}`,
    metadata: { student_id: studentId },
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-zinc-200 px-8 py-4 flex items-center gap-4">
        <Link
          href="/admin/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          ← Back to admin
        </Link>
        <span className="text-zinc-300">·</span>
        <span className="text-sm text-zinc-700 font-medium">{student.name} — /lab view</span>
        <span className="ml-auto text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">Read-only</span>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8 space-y-8">

        {/* Profile Card */}
        {profile ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">
              Student Profile
            </h2>
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="font-semibold text-zinc-900">{profile.full_name}</span>
              {profile.grade && (
                <span className="text-sm text-zinc-500">Grade {profile.grade}</span>
              )}
              {conversations[0]?.essay_mode && (
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                  {MODE_LABELS[conversations[0].essay_mode] ?? conversations[0].essay_mode}
                </span>
              )}
              {conversations[0]?.updated_at && (
                <span className="text-xs text-zinc-400 ml-auto">
                  Last active {relativeTime(conversations[0].updated_at)}
                </span>
              )}
            </div>
            {profile.portrait_notes && (
              <p className="text-sm leading-relaxed text-zinc-700 border-t border-zinc-100 pt-4">
                {profile.portrait_notes}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-5">
            <p className="text-sm text-zinc-400">No student profile found for this user.</p>
          </div>
        )}

        {/* Conversations list */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
            Recent Conversations ({conversations.length})
          </h2>
          {conversations.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-6 text-center">
              <p className="text-sm text-zinc-400">No conversations yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv, idx) => (
                <div
                  key={conv.id}
                  className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${
                    idx === 0
                      ? "border-zinc-300 bg-white shadow-sm"
                      : "border-zinc-100 bg-zinc-50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-800 truncate">{conv.title}</p>
                    {conv.essay_mode && (
                      <span className="text-xs text-zinc-400">
                        {MODE_LABELS[conv.essay_mode] ?? conv.essay_mode}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-zinc-400">{relativeTime(conv.updated_at)}</span>
                  {idx === 0 && (
                    <span className="shrink-0 text-xs bg-zinc-100 text-zinc-500 rounded px-1.5 py-0.5">
                      Shown below
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message thread from most recent conversation */}
        {recentMessages.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
              Message Thread — {conversations[0]?.title ?? "Most Recent"}
            </h2>
            <div className="space-y-3">
              {recentMessages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        isUser
                          ? "bg-zinc-900 text-white rounded-br-sm"
                          : "bg-zinc-100 text-zinc-800 rounded-bl-sm"
                      }`}
                    >
                      {msg.file_name && (
                        <p className="text-xs opacity-60 mb-1 font-medium">
                          📎 {msg.file_name}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isUser ? "text-zinc-400" : "text-zinc-400"}`}>
                        {relativeTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

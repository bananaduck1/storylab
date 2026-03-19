import { redirect } from "next/navigation";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import { ADMIN_EMAIL } from "@/lib/lab-auth";
import RevenueTable from "./_components/RevenueTable";

interface StatCard {
  label: string;
  value: number | null;
  description?: string;
}

function StatCard({ label, value, description }: StatCard) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">{label}</p>
      <p className="text-3xl font-semibold text-zinc-900">
        {value === null ? "—" : value.toLocaleString()}
      </p>
      {description && (
        <p className="text-xs text-zinc-400 mt-1">{description}</p>
      )}
    </div>
  );
}

export default async function PlatformPage() {
  const user = await getCallerUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    redirect("/login");
  }

  const db = getSupabase();

  const [
    teachersRes,
    studentsRes,
    conversationsRes,
    recentSessionsRes,
    recentMessagesRes,
    newTeachersRes,
  ] = await Promise.all([
    db.from("teachers").select("*", { count: "exact", head: true }),
    db.from("students").select("*", { count: "exact", head: true }),
    db.from("conversations").select("*", { count: "exact", head: true }),
    db
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    db
      .from("conversation_messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    db
      .from("teachers")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const stats: StatCard[] = [
    {
      label: "Total Teachers",
      value: teachersRes.count,
      description: "All registered teachers",
    },
    {
      label: "Total Students",
      value: studentsRes.count,
      description: "All student records",
    },
    {
      label: "Total Conversations",
      value: conversationsRes.count,
      description: "All /lab AI conversations",
    },
    {
      label: "Sessions (7 days)",
      value: recentSessionsRes.count,
      description: "Coaching sessions in past week",
    },
    {
      label: "AI Messages (7 days)",
      value: recentMessagesRes.count,
      description: "Lab messages in past week",
    },
    {
      label: "New Teachers (30 days)",
      value: newTeachersRes.count,
      description: "Teacher signups in past month",
    },
  ];

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-zinc-900">Platform Pulse</h1>
        <p className="text-sm text-zinc-500 mt-1">Live stats across the StoryLab platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-8">
        <RevenueTable />
      </div>
    </div>
  );
}

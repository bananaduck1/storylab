import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgWithStatus, isOrgMember } from "@/lib/org-auth";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

interface Props { params: Promise<{ slug: string }> }

export default async function OrgHomePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/org/${slug}`);

  const org = await getOrgWithStatus(slug);
  if (!org) redirect("/");

  // Check subscription gate
  if (org.subscription_status !== "active") {
    // Check if admin (they can still access admin to renew)
    const db = getSupabase();
    const { data: teacher } = await db.from("teachers").select("id").eq("user_id", user.id).maybeSingle();
    if (teacher) {
      const { data: adminRow } = await db.from("org_teachers").select("role").eq("teacher_id", teacher.id).eq("org_id", org.id).maybeSingle();
      if (adminRow?.role === "admin") redirect(`/org/${slug}/admin`);
    }
    redirect(`/org/${slug}/lapsed`);
  }

  const member = await isOrgMember(user.id, slug);
  if (!member) redirect(`/org/${slug}/join`);

  // Load teachers in this org
  const db = getSupabase();
  const { data: orgTeachers } = await db
    .from("org_teachers")
    .select("role, teachers(id, name, subject, slug, quote, photo_url)")
    .eq("org_id", org.id);

  const teachers = (orgTeachers ?? []).map(ot => (ot as any).teachers).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Org header */}
      <section className="bg-[#2C4A3E] text-white px-6 py-12 text-center">
        <p className="text-xs uppercase tracking-[0.12em] text-white/60 mb-2" style={{ fontFamily: "var(--font-cooper)" }}>
          Welcome to
        </p>
        <h1 className="text-4xl font-black" style={{ fontFamily: "var(--font-cooper)" }}>{org.name}</h1>
        <p className="mt-2 text-white/70 text-sm" style={{ fontFamily: "var(--font-cooper)" }}>Private StoryLab community</p>
      </section>

      {/* Teacher roster */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-[#1A2E26] mb-8" style={{ fontFamily: "var(--font-cooper)" }}>
          Your Tutors
        </h2>
        {teachers.length === 0 ? (
          <div className="bg-[#DEEEE9] rounded-[4px] p-8 text-center">
            <p className="text-[#1A2E26]/70" style={{ fontFamily: "var(--font-cooper)" }}>No tutors yet in your community.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teachers.map((t: any) => (
              <Link
                key={t.id}
                href={`/teachers/${t.slug}`}
                className="block border border-[#C0D9CB] rounded-[4px] p-6 hover:border-[#2C4A3E] transition-colors bg-white"
              >
                <div className="font-bold text-[#1A2E26] text-lg" style={{ fontFamily: "var(--font-cooper)" }}>{t.name}</div>
                {t.subject && <div className="text-[#1A2E26]/60 text-sm mt-1" style={{ fontFamily: "var(--font-cooper)" }}>{t.subject}</div>}
                {t.quote && <div className="mt-3 text-[#1A2E26]/80 text-sm italic" style={{ fontFamily: "var(--font-cooper)" }}>&ldquo;{t.quote}&rdquo;</div>}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <Link
          href="/lab"
          className="inline-block bg-[#2C4A3E] text-white px-8 py-3 rounded-[3px] font-medium hover:bg-[#3A6054] transition-colors"
          style={{ fontFamily: "var(--font-cooper)" }}
        >
          Open your AI coach →
        </Link>
      </section>
    </div>
  );
}

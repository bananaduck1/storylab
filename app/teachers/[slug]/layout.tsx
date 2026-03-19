import Link from "next/link";
import { notFound } from "next/navigation";
import { createStaticClient } from "@/lib/supabase/server";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function TeacherLayout({ children, params }: Props) {
  const { slug } = await params;
  const supabase = createStaticClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("name, subject, slug, storefront_published")
    .eq("slug", slug)
    .maybeSingle();

  if (!teacher) notFound();

  return (
    <>
      {/* Context strip */}
      <div
        className="bg-[#DEEEE9] border-b border-[#C0D9CB] px-6 py-2.5"
        aria-label={`You are viewing ${teacher.name}'s page`}
      >
        <div className="mx-auto max-w-6xl flex items-center gap-2">
          {/* Mobile: show only back link */}
          <Link
            href="/teachers"
            className="text-[0.7rem] font-medium text-[#1A2E26]/70 hover:text-[#2C4A3E] transition-colors focus:outline-none focus-visible:underline"
            aria-label="Back to all teachers"
          >
            ← All Teachers
          </Link>

          {/* Desktop: show full breadcrumb */}
            <span aria-hidden="true">·</span>
            <span className="text-[#1A2E26]/70 font-medium">{teacher.name}</span>
            {teacher.subject && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#1A2E26]/50">{teacher.subject}</span>
              </>
            )}
        </div>
      </div>

      {children}
    </>
  );
}

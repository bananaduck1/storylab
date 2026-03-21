import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createStaticClient } from "@/lib/supabase/server";
import { TeacherStorefrontContent } from "./_components/TeacherStorefrontContent";
import type { StorefrontContent } from "@/lib/types/storefront";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export async function generateStaticParams() {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from("teachers")
    .select("slug")
    .eq("storefront_published", true);

  return (data ?? []).map((t) => ({ slug: t.slug as string }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createStaticClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("name, subject, quote")
    .eq("slug", slug)
    .eq("storefront_published", true)
    .maybeSingle();

  if (!teacher) return { title: "Teacher Not Found" };

  return {
    title: `${teacher.name} — StoryLab`,
    description: teacher.quote ?? `${teacher.name} is a ${teacher.subject ?? "teacher"} on StoryLab.`,
  };
}

export default async function TeacherStorefrontPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createStaticClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, name, slug, subject, bio, photo_url, quote, storefront_published, accepting_bookings, accepting_students, ai_coaching_enabled, live_sessions_enabled, primary_emphasis, storefront_content")
    .eq("slug", slug)
    .eq("storefront_published", true)
    .maybeSingle();

  if (!teacher) notFound();

  return (
    <TeacherStorefrontContent
      teacherSlug={teacher.slug}
      teacherName={teacher.name}
      teacherBio={teacher.bio}
      teacherPhotoUrl={teacher.photo_url}
      teacherQuote={teacher.quote}
      teacherSubject={teacher.subject}
      teacherId={teacher.id}
      acceptingBookings={teacher.accepting_bookings ?? false}
      acceptingStudents={teacher.accepting_students ?? true}
      aiCoachingEnabled={teacher.ai_coaching_enabled ?? false}
      liveSessionsEnabled={teacher.live_sessions_enabled ?? false}
      primaryEmphasis={(teacher.primary_emphasis as 'ai' | 'live' | 'equal') ?? 'ai'}
      storefrontContent={teacher.storefront_content as StorefrontContent | null}
    />
  );
}

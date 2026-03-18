import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createStaticClient } from "@/lib/supabase/server";
import { TeacherStorefrontContent } from "./_components/TeacherStorefrontContent";

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
    description: teacher.quote ?? `${teacher.name} is a ${teacher.subject ?? "writing coach"} on StoryLab.`,
  };
}

export default async function TeacherStorefrontPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createStaticClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, name, slug, subject, bio, photo_url, quote, storefront_published, accepting_bookings")
    .eq("slug", slug)
    .eq("storefront_published", true)
    .maybeSingle();

  if (!teacher) notFound();

  return (
    <TeacherStorefrontContent
      teacherSlug={teacher.slug}
      teacherName={teacher.name}
      acceptingBookings={teacher.accepting_bookings ?? false}
    />
  );
}

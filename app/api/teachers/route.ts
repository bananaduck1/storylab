import { NextResponse } from "next/server";
import { createStaticClient } from "@/lib/supabase/server";

export const revalidate = 60;

export async function GET() {
  const supabase = createStaticClient();

  const { data: teachers, error } = await supabase
    .from("teachers")
    .select("id, name, slug, subject, photo_url, quote")
    .eq("storefront_published", true)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }

  return NextResponse.json({ teachers: teachers ?? [] });
}

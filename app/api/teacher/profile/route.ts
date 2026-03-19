import { NextRequest, NextResponse } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getCallerTeacher } from "@/lib/teacher";
import { getSupabase } from "@/lib/supabase";
import { hasInjection, MAX_FIELD, MAX_SHORT_FIELD } from "@/lib/content-validation";

export async function PATCH(req: NextRequest) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teacher = await getCallerTeacher(user.id);
  if (!teacher) return NextResponse.json({ error: "Not a teacher" }, { status: 403 });

  const body = await req.json();
  const { bio, quote, subject } = body;

  // Validate bio
  if (bio !== undefined && bio !== null) {
    if (typeof bio !== "string") return NextResponse.json({ error: "bio must be a string" }, { status: 400 });
    if (bio.length > MAX_FIELD) return NextResponse.json({ error: "bio too long" }, { status: 400 });
    if (hasInjection(bio)) return NextResponse.json({ error: "bio contains disallowed content" }, { status: 400 });
  }

  // Validate quote
  if (quote !== undefined && quote !== null) {
    if (typeof quote !== "string") return NextResponse.json({ error: "quote must be a string" }, { status: 400 });
    if (quote.length > MAX_FIELD) return NextResponse.json({ error: "quote too long" }, { status: 400 });
    if (hasInjection(quote)) return NextResponse.json({ error: "quote contains disallowed content" }, { status: 400 });
  }

  // Validate subject
  if (subject !== undefined && subject !== null) {
    if (typeof subject !== "string") return NextResponse.json({ error: "subject must be a string" }, { status: 400 });
    if (subject.length > MAX_SHORT_FIELD) return NextResponse.json({ error: "subject too long" }, { status: 400 });
    if (hasInjection(subject)) return NextResponse.json({ error: "subject contains disallowed content" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (bio !== undefined) updates.bio = bio || null;
  if (quote !== undefined) updates.quote = quote || null;
  if (subject !== undefined) updates.subject = subject || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("teachers")
    .update(updates)
    .eq("id", teacher.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

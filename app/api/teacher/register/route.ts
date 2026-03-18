import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getCallerUser } from "@/lib/lab-auth";

export async function POST(req: NextRequest) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.email) return NextResponse.json({ error: "Account has no email" }, { status: 422 });

  const { name, subject } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const db = getSupabase();

  const { data: existing } = await db
    .from("teachers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return NextResponse.json({ id: existing.id }, { status: 200 }); // idempotent

  const { data, error } = await db
    .from("teachers")
    .insert({
      user_id: user.id,
      name: name.trim(),
      email: user.email,
      subject: subject?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}

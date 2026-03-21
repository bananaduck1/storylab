import { NextRequest, NextResponse } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await getSupabase()
    .from("conversations")
    .select("id, title, updated_at, essay_mode")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

const VALID_MODES = ["common_app", "transfer", "academic", "supplemental"] as const;
type EssayMode = (typeof VALID_MODES)[number];

export async function POST(req: NextRequest) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = (body?.title as string)?.trim() || "New conversation";
  const rawMode = body?.essay_mode as string | undefined;
  const essay_mode: EssayMode = VALID_MODES.includes(rawMode as EssayMode)
    ? (rawMode as EssayMode)
    : "common_app";

  const { data, error } = await getSupabase()
    .from("conversations")
    .insert({ user_id: user.id, title, essay_mode })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

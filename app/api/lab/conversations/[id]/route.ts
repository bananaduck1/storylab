import { NextRequest, NextResponse } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";

async function getOwnedConversation(convId: string, userId: string) {
  const { data } = await getSupabase()
    .from("conversations")
    .select("id")
    .eq("id", convId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conv = await getOwnedConversation(id, user.id);
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await getSupabase()
    .from("conversation_messages")
    .select("id, role, content, file_name, file_type, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conv = await getOwnedConversation(id, user.id);
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updates: Record<string, string> = {};

  if (body.title?.trim()) {
    updates.title = body.title.trim();
  }

  const VALID_MODES = ["common_app", "transfer", "academic", "supplemental"];
  if (VALID_MODES.includes(body.essay_mode)) {
    updates.essay_mode = body.essay_mode;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("conversations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conv = await getOwnedConversation(id, user.id);
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft delete — messages remain in DB. Hard delete is deferred.
  const { error } = await getSupabase()
    .from("conversations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}

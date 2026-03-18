import { NextResponse } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";

// POST /api/notifications/read
// Marks all unread notifications as read for the user
export async function POST() {
  const user = await getCallerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabase();

  const { error } = await db
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

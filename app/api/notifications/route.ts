import { NextResponse } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";

export interface Notification {
  id: string;
  user_id: string;
  event_type: string;
  body: string;
  read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// GET /api/notifications
// Returns last 20 notifications for the authenticated user
export async function GET() {
  const user = await getCallerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabase();

  const { data, error } = await db
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const notifications = (data ?? []) as Notification[];
  const unread = notifications.filter((n) => !n.read).length;

  return NextResponse.json({ notifications, unread });
}

// POST /api/session/[id]/consent
// Records that the authenticated student has agreed to the session consent notice.
// Idempotent — returns 200 whether the row was just inserted or already existed.
// Students only; teachers do not need to consent.

import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getCallerUser, getUserRole, getCallerStudentId } from "@/lib/lab-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Teachers don't go through the consent gate
  if (getUserRole(user) === "teacher") {
    return NextResponse.json({ error: "Teachers do not require consent" }, { status: 400 });
  }

  // Verify the session exists and belongs to this student
  const supabase = getSupabase();
  const { data: session } = await supabase
    .from("sessions")
    .select("id, student_id")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Ownership check: ensure the authenticated user is the student on this session
  const studentId = await getCallerStudentId(user.id);
  if (!studentId || studentId !== session.student_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Forward IP for audit trail (best-effort)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;

  const { error } = await supabase.from("session_consents").upsert(
    {
      session_id: sessionId,
      user_id: user.id,
      agreement_version: "1.0",
      ip_address: ip,
    },
    { onConflict: "session_id,user_id", ignoreDuplicates: false }
  );

  if (error) {
    console.error("[session/consent] upsert failed:", error);
    return NextResponse.json({ error: "Unable to save consent — try again" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

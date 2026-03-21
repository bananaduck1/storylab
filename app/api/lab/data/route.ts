// PATCH /api/lab/data
// Updates the student's own data preferences.
// Currently: recordings_consent toggle.

import { NextRequest, NextResponse } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";

export async function PATCH(req: NextRequest) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  if (typeof body.recordings_consent !== "boolean") {
    return NextResponse.json({ error: "recordings_consent must be a boolean" }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("student_profiles")
    .update({ recordings_consent: body.recordings_consent })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

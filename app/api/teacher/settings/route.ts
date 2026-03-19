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
  const { identity, core_beliefs, diagnostic_eye, voice, signature_moves } = body;

  // Validate each field
  for (const [key, val] of Object.entries({ identity, core_beliefs, diagnostic_eye, voice })) {
    if (val !== undefined && val !== null) {
      if (typeof val !== "string") return NextResponse.json({ error: `${key} must be a string` }, { status: 400 });
      if (val.length > MAX_FIELD) return NextResponse.json({ error: `${key} too long` }, { status: 400 });
      if (hasInjection(val)) return NextResponse.json({ error: `${key} contains disallowed content` }, { status: 400 });
    }
  }
  if (signature_moves !== undefined && signature_moves !== null) {
    if (!Array.isArray(signature_moves)) return NextResponse.json({ error: "signature_moves must be array" }, { status: 400 });
    for (const m of signature_moves) {
      if (typeof m !== "string" || m.length > MAX_SHORT_FIELD) return NextResponse.json({ error: "signature_moves item too long" }, { status: 400 });
      if (hasInjection(m)) return NextResponse.json({ error: "signature_moves contains disallowed content" }, { status: 400 });
    }
  }

  const agent_config = {
    ...(identity !== undefined && { identity }),
    ...(core_beliefs !== undefined && { core_beliefs }),
    ...(diagnostic_eye !== undefined && { diagnostic_eye }),
    ...(voice !== undefined && { voice }),
    ...(signature_moves !== undefined && { signature_moves }),
  };

  const { error } = await getSupabase()
    .from("teachers")
    .update({ agent_config })
    .eq("id", teacher.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

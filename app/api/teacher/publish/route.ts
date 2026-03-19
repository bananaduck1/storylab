import { NextRequest, NextResponse } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getCallerTeacher } from "@/lib/teacher";
import { getSupabase } from "@/lib/supabase";

export async function PATCH(req: NextRequest) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teacher = await getCallerTeacher(user.id);
  if (!teacher) return NextResponse.json({ error: "Not a teacher" }, { status: 403 });

  const body = await req.json();
  const { storefront_published } = body;

  if (typeof storefront_published !== "boolean") {
    return NextResponse.json({ error: "storefront_published must be a boolean" }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("teachers")
    .update({ storefront_published })
    .eq("id", teacher.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { getCallerUser, getUserRole } from "@/lib/lab-auth";
import { generatePortrait } from "@/lib/portrait-generation";

export async function POST(req: NextRequest) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (getUserRole(user) !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { student_id, new_session_id } = await req.json();

  if (!student_id) {
    return NextResponse.json({ error: "student_id required" }, { status: 400 });
  }

  try {
    const portrait = await generatePortrait(student_id, new_session_id);
    return NextResponse.json(portrait, { status: 201 });
  } catch (err: any) {
    const msg = err?.message ?? "Portrait generation failed";
    const status = msg.includes("Student not found") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

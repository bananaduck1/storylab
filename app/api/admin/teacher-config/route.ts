import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getCallerUser } from "@/lib/lab-auth";

// Protected by middleware — only samahn240@gmail.com can reach /api/admin/*

const MAX_FIELD_LENGTH = 5000;
const MAX_MOVE_LENGTH = 500;
const INJECTION_PHRASES = [
  "ignore previous instructions",
  "ignore all previous",
  "disregard all previous",
  "you are now",
  "forget all instructions",
  "override instructions",
  "new instructions:",
  "system prompt:",
];

function detectInjection(text: string): boolean {
  const lower = text.toLowerCase();
  return INJECTION_PHRASES.some((phrase) => lower.includes(phrase));
}

function validateConfig(config: unknown): string | null {
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    return "agent_config must be an object";
  }
  const c = config as Record<string, unknown>;

  const fields: Array<[string, number]> = [
    ["identity", MAX_FIELD_LENGTH],
    ["core_beliefs", MAX_FIELD_LENGTH],
    ["diagnostic_eye", MAX_FIELD_LENGTH],
    ["voice", MAX_FIELD_LENGTH],
  ];

  for (const [field, maxLen] of fields) {
    if (field in c) {
      if (typeof c[field] !== "string") return `${field} must be a string`;
      if ((c[field] as string).length > maxLen) return `${field} exceeds ${maxLen} character limit`;
      if (detectInjection(c[field] as string)) return `${field} contains disallowed content`;
    }
  }

  if ("signature_moves" in c) {
    if (!Array.isArray(c.signature_moves)) return "signature_moves must be an array";
    for (const move of c.signature_moves as unknown[]) {
      if (typeof move !== "string") return "each signature_move must be a string";
      if (move.length > MAX_MOVE_LENGTH) return `a signature_move exceeds ${MAX_MOVE_LENGTH} character limit`;
      if (detectInjection(move)) return "a signature_move contains disallowed content";
    }
  }

  return null;
}

export async function GET() {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await getSupabase()
    .from("teachers")
    .select("id, name, agent_config, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const user = await getCallerUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { agent_config?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { agent_config } = body;
  if (!agent_config) {
    return NextResponse.json({ error: "agent_config is required" }, { status: 400 });
  }

  const validationError = validateConfig(agent_config);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("teachers")
    .update({ agent_config, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select("id, name, agent_config, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  console.log("[admin/teacher-config] saved", { userId: user.id, teacherName: data.name });
  return NextResponse.json(data);
}

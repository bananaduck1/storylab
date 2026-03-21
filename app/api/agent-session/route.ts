import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { retrieveKnowledge } from "@/lib/knowledge-retrieval";
import { SYSTEM_PROMPT } from "@/lib/agent-system-prompt";

export const runtime = "nodejs";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function buildTeacherSystemPromptPrefix(teacherName: string): string {
  return `You are not speaking directly to the student right now. You are advising the teacher (${teacherName}) who is running a live session. Everything in this playbook describes how ${teacherName} works — use it to coach them in real-time on what to notice, what to ask, and what move to make next.

Your job: translate the principles below into live session guidance. Be concise and directive. Speak like a thoughtful colleague observing from the side: "Try asking...", "I'd notice...", "This feels like a moment to...". Surface patterns from the student's portrait. Name what's happening. Help ${teacherName} stay in their own mode of working rather than drifting into generic tutoring.

You are NOT the counselor in this conversation — ${teacherName} is. You are the voice in their ear.

The full playbook follows. Apply it to the live session:

---
`;
}

export async function POST(req: NextRequest) {
  const { studentId, messages, mode = "student" } = (await req.json()) as {
    studentId: string;
    messages: Message[];
    mode?: "teacher" | "student";
  };

  if (!studentId) {
    return new Response(JSON.stringify({ error: "studentId required" }), { status: 400 });
  }

  // ── fetch student context ──────────────────────────────────────────────────

  const [studentRes, portraitRes, sessionsRes] = await Promise.all([
    (getSupabase() as any).from("students").select("name, development_stage, teacher_id, teachers(name)").eq("id", studentId).single(),
    getSupabase()
      .from("portraits")
      .select("content_json")
      .eq("student_id", studentId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getSupabase()
      .from("sessions")
      .select("key_observations, date")
      .eq("student_id", studentId)
      .order("date", { ascending: false })
      .limit(3),
  ]);

  const student = studentRes.data;
  if (!student) {
    return new Response(JSON.stringify({ error: "Student not found" }), { status: 404 });
  }

  const studentTeacher = student.teachers as { name: string } | null;
  const teacherName = studentTeacher?.name?.split(" ")[0] || "Coach";

  const portrait = portraitRes.data?.content_json as { portrait_narrative?: string } | null;
  const recentSessions = sessionsRes.data ?? [];

  // ── retrieve relevant knowledge chunks ────────────────────────────────────

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const queryText = lastUserMessage?.content ?? student.name;

  let knowledgeChunks: string[] = [];
  try {
    knowledgeChunks = await retrieveKnowledge(queryText, { limit: 5 });
  } catch {
    // Non-fatal — proceed without RAG if retrieval fails
  }

  // ── build system prompt ───────────────────────────────────────────────────

  const contextBlocks: string[] = [
    `---`,
    `STUDENT CONTEXT:`,
    `Name: ${student.name}`,
    `Development stage: ${student.development_stage}`,
  ];

  if (portrait?.portrait_narrative) {
    contextBlocks.push(`Intellectual portrait: ${portrait.portrait_narrative}`);
  }

  if (recentSessions.length > 0) {
    const notesLines = recentSessions
      .filter((s) => s.key_observations)
      .map((s) => `[${s.date}] ${s.key_observations}`)
      .join("\n");
    if (notesLines) {
      contextBlocks.push(`Recent session notes:\n${notesLines}`);
    }
  }

  if (knowledgeChunks.length > 0) {
    contextBlocks.push(
      `\nRETRIEVED KNOWLEDGE FROM TRAINING DOCS:\n${knowledgeChunks.join("\n\n---\n\n")}`
    );
  }

  contextBlocks.push(`---`);

  const basePrompt = mode === "teacher"
    ? buildTeacherSystemPromptPrefix(teacherName) + SYSTEM_PROMPT
    : SYSTEM_PROMPT;

  const finalSystemPrompt = basePrompt + "\n\n" + contextBlocks.join("\n");

  // ── stream OpenAI response ─────────────────────────────────────────────────

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set" }), { status: 500 });
  }

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: finalSystemPrompt },
        ...messages,
      ],
      max_tokens: 1024,
      stream: true,
    }),
  });

  if (!openaiRes.ok) {
    const err = await openaiRes.text();
    return new Response(JSON.stringify({ error: `OpenAI error: ${err}` }), { status: 500 });
  }

  // Pipe the SSE stream straight through to the client
  return new Response(openaiRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { retrieveKnowledge } from "@/lib/knowledge-retrieval";
import { SYSTEM_PROMPT } from "@/lib/agent-system-prompt";

export const runtime = "nodejs";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const TEACHER_SYSTEM_PROMPT_PREFIX = `You are a real-time session coaching assistant for a college counselor/tutor. You are NOT speaking to the student — you are advising the tutor who is running a live session. Your role: suggest specific questions to ask, name patterns worth probing, surface themes from the student's portrait, and help the tutor stay curious and strategic. Be concise and direct. Think like a thoughtful colleague observing the session from outside.`;

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
    getSupabase().from("students").select("name, development_stage").eq("id", studentId).single(),
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
    ? TEACHER_SYSTEM_PROMPT_PREFIX
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

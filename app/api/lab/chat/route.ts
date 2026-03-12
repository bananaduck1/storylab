import { NextRequest } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import { buildSystemPromptForUser } from "@/lib/lab-profile";
import { retrieveKnowledge } from "@/lib/knowledge-retrieval";

const DAILY_LIMIT = parseInt(process.env.LAB_DAILY_LIMIT ?? "50");
const HISTORY_LIMIT = 20;

export async function POST(request: NextRequest) {
  const user = await getCallerUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: {
    conversation_id: string;
    message: string;
    file_text?: string;
    file_name?: string;
    file_type?: string;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { conversation_id, message, file_text, file_name, file_type } = body;

  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response("AI service not configured", { status: 500 });
  }

  const db = getSupabase();

  // ── rate limit check ──────────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const { count: usedToday } = await db
    .from("usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("day", today);

  const used = usedToday ?? 0;
  const remaining = DAILY_LIMIT - used;

  if (remaining <= 0) {
    return new Response(
      JSON.stringify({ error: "daily_limit_reached", limit: DAILY_LIMIT, used }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": String(DAILY_LIMIT),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // ── validate conversation ownership ──────────────────────────────────────
  const { data: conv } = await db
    .from("conversations")
    .select("id")
    .eq("id", conversation_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!conv) {
    return new Response(JSON.stringify({ error: "Conversation not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── load message history ──────────────────────────────────────────────────
  const { data: historyRows } = await db
    .from("conversation_messages")
    .select("role, content")
    .eq("conversation_id", conversation_id)
    .order("created_at", { ascending: true })
    .limit(HISTORY_LIMIT);

  const history = (historyRows ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content as string,
  }));

  // ── persist user message immediately ─────────────────────────────────────
  await db.from("conversation_messages").insert({
    conversation_id,
    user_id: user.id,
    role: "user",
    content: message,
    file_name: file_name ?? null,
    file_type: file_type ?? null,
  });

  // Auto-title the conversation if this is the first message
  if (history.length === 0) {
    const title = message.replace(/\n/g, " ").slice(0, 60).trim();
    await db
      .from("conversations")
      .update({ title })
      .eq("id", conversation_id);
  }

  // ── build effective user content (with file if present) ──────────────────
  const effectiveContent = file_text
    ? `[Attached document: "${file_name ?? "document"}"]\n\n${file_text}\n\n---\n\n${message}`
    : message;

  // ── build system prompt (profile + RAG) ──────────────────────────────────
  let systemContent = await buildSystemPromptForUser(user.id);

  try {
    const chunks = await retrieveKnowledge(message, { limit: 6 });
    if (chunks.length > 0) {
      systemContent +=
        "\n\n---\nRELEVANT TRAINING CONTEXT (from playbook and case studies):\n\n" +
        chunks.join("\n\n---\n\n") +
        "\n---";
    }
  } catch {
    // best-effort RAG — proceed without it
  }

  // ── stream from OpenAI ────────────────────────────────────────────────────
  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      stream: true,
      stream_options: { include_usage: true },
      messages: [
        { role: "system", content: systemContent },
        ...history,
        { role: "user", content: effectiveContent },
      ],
    }),
  });

  if (!openaiRes.ok) {
    const err = await openaiRes.text();
    return new Response(err, { status: openaiRes.status });
  }

  const encoder = new TextEncoder();
  let accumulated = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = openaiRes.body!.getReader();
      const decoder = new TextDecoder();
      let done = false;

      try {
        while (!done) {
          const { done: rdDone, value } = await reader.read();
          if (rdDone) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

          for (const line of lines) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              done = true;
              break;
            }
            try {
              const json = JSON.parse(data);
              const text: string | undefined = json.choices?.[0]?.delta?.content;
              if (text) {
                accumulated += text;
                controller.enqueue(encoder.encode(text));
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } finally {
        reader.releaseLock();
        controller.close();

        // Persist assistant message + log usage after stream ends
        void (async () => {
          try {
            if (accumulated) {
              await db.from("conversation_messages").insert({
                conversation_id,
                user_id: user.id,
                role: "assistant",
                content: accumulated,
              });
            }
            await db.from("usage_logs").insert({
              user_id: user.id,
              conversation_id,
              day: today,
            });
            await db
              .from("conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", conversation_id);
          } catch (persistErr) {
            console.error("Failed to persist chat turn:", persistErr);
          }
        })();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-RateLimit-Limit": String(DAILY_LIMIT),
      "X-RateLimit-Remaining": String(remaining - 1),
    },
  });
}

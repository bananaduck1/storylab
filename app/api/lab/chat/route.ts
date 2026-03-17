import { NextRequest, after } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import { buildSystemPromptForUser } from "@/lib/lab-profile";
import { retrieveKnowledge } from "@/lib/knowledge-retrieval";
import { checkQuota, debitQuota } from "@/lib/lab-quota";

const MAX_FILE_TEXT_LENGTH = 8000;
const HISTORY_LIMIT = 20;

// Explicit output cap — gpt-4o defaults to 4096; detailed essay reviews can hit that ceiling.
// 4096 tokens ≈ 3,000 words — generous for a coaching response without runaway costs.
const MAX_RESPONSE_TOKENS = 4096;

// Set LAB_DEBUG=1 in .env.local to log request payloads to server console.
const DEBUG = process.env.LAB_DEBUG === "1";

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

  // ── quota check ───────────────────────────────────────────────────────────
  const quota = await checkQuota(user.id);

  if (!quota || quota.remaining <= 0) {
    const limitType =
      !quota || quota.plan === "free"
        ? "daily_limit_reached"
        : "monthly_limit_reached";
    return new Response(
      JSON.stringify({ error: limitType, remaining: 0 }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
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

  // ── build effective user content ──────────────────────────────────────────
  // Do this BEFORE RAG so we can use essay text as the retrieval query.
  const safeFileText = file_text
    ? file_text.slice(0, MAX_FILE_TEXT_LENGTH)
    : undefined;
  const effectiveContent = safeFileText
    ? `[Attached document: "${file_name ?? "document"}"]\n\n${safeFileText}\n\n---\n\n${message}`
    : message;

  // ── build system prompt (profile + RAG) ──────────────────────────────────
  let systemContent = await buildSystemPromptForUser(user.id);

  // When a document is attached, query RAG with the essay text (first 1 500 chars)
  // plus the user's message so retrieval targets the actual draft content, not just
  // a generic "please review" string.
  const ragQuery = safeFileText
    ? `${message}\n\n${safeFileText.slice(0, 1500)}`
    : message;

  let ragChunks: string[] = [];
  try {
    ragChunks = await retrieveKnowledge(ragQuery, { limit: 6 });
    if (ragChunks.length > 0) {
      systemContent +=
        "\n\n---\nRELEVANT TRAINING CONTEXT (from playbook and case studies):\n\n" +
        ragChunks.join("\n\n---\n\n") +
        "\n---";
    }
  } catch {
    // best-effort RAG — proceed without it
  }

  // ── debug logging ─────────────────────────────────────────────────────────
  if (DEBUG) {
    console.log("[lab/chat/debug] request payload summary", {
      userId: user.id,
      conversationId: conversation_id,
      systemPromptChars: systemContent.length,
      ragChunksRetrieved: ragChunks.length,
      ragChunkLengths: ragChunks.map((c) => c.length),
      historyMessages: history.length,
      effectiveContentChars: effectiveContent.length,
      hasFileAttachment: !!safeFileText,
      fileChars: safeFileText?.length ?? 0,
      maxResponseTokens: MAX_RESPONSE_TOKENS,
    });
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
      max_tokens: MAX_RESPONSE_TOKENS,
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
  const today = new Date().toISOString().split("T")[0];
  const { debitType } = quota;

  const stream = new ReadableStream({
    async start(controller) {
      const reader = openaiRes.body!.getReader();
      const decoder = new TextDecoder();
      // Buffer for incomplete SSE lines that span multiple read() calls.
      // Without this, a "data: {...}" line split across two network reads would
      // produce one truncated JSON (parse error → silently dropped) and one
      // orphaned fragment not starting with "data: " (filtered out) — losing
      // every token in that pair of chunks.
      let lineBuffer = "";
      let done = false;

      try {
        while (!done) {
          const { done: rdDone, value } = await reader.read();
          if (rdDone) break;

          lineBuffer += decoder.decode(value, { stream: true });

          // Split on newlines, keeping the last (potentially incomplete) line
          // in the buffer for the next iteration.
          const lines = lineBuffer.split("\n");
          lineBuffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") {
              done = true;
              break;
            }
            try {
              const json = JSON.parse(data);
              const choice = json.choices?.[0];
              const text: string | undefined = choice?.delta?.content;
              if (text) {
                accumulated += text;
                controller.enqueue(encoder.encode(text));
              }
              // Warn if the model was cut off at the token limit
              if (choice?.finish_reason === "length") {
                console.warn(
                  "[lab/chat] finish_reason=length — response hit max_tokens limit.",
                  { maxTokens: MAX_RESPONSE_TOKENS, accumulatedChars: accumulated.length }
                );
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } finally {
        reader.releaseLock();
        controller.close();

        after(async () => {
          try {
            if (accumulated) {
              await db.from("conversation_messages").insert({
                conversation_id,
                user_id: user.id,
                role: "assistant",
                content: accumulated,
              });
            }
            await debitQuota(user.id, debitType, conversation_id, today);
            await db
              .from("conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", conversation_id);
          } catch (persistErr) {
            console.error("Failed to persist chat turn:", persistErr);
          }
        });
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-RateLimit-Remaining": String(quota.remaining - 1),
    },
  });
}

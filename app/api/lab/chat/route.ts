import { NextRequest, after } from "next/server";
import { getCallerUser } from "@/lib/lab-auth";
import { getSupabase } from "@/lib/supabase";
import { buildSystemPromptForUser, writePortraitNote } from "@/lib/lab-profile";
import { inferPhase, type EssayMode } from "@/lib/behavioral-constraints";
import {
  embedQuery,
  retrievePlaybookByVector,
  retrieveCaseStudyByVector,
} from "@/lib/knowledge-retrieval";
import { checkQuota, debitQuota } from "@/lib/lab-quota";

const MAX_FILE_TEXT_LENGTH = 8000;
const HISTORY_LIMIT = 20;

// Explicit output cap — gpt-4o defaults to 4096; detailed essay reviews can hit that ceiling.
// 4096 tokens ≈ 3,000 words — generous for a coaching response without runaway costs.
const MAX_RESPONSE_TOKENS = 4096;

// gpt-4o-mini for portrait notes — cheap and fast; runs in after() so latency doesn't matter.
const PORTRAIT_MODEL = "gpt-4o-mini";

// Set LAB_DEBUG=1 in .env.local to log request payloads to server console.
const DEBUG = process.env.LAB_DEBUG === "1";

// Generates a brief note for Sam's portrait of this student based on the conversation.
// Returns an empty string on failure so the caller's guard handles it cleanly.
export async function generatePortraitNote(
  apiKey: string,
  recentUserMessages: string[],
  assistantSummary: string
): Promise<string> {
  const context = [
    "Recent student messages:",
    ...recentUserMessages.map((m, i) => `[${i + 1}] ${m.slice(0, 300)}`),
    "",
    "Sam's response (summary):",
    assistantSummary.slice(0, 200),
  ].join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: PORTRAIT_MODEL,
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content:
            "You are Sam's memory system. Given this coaching exchange, write 1–3 sentences " +
            "about what Sam should remember about this student for the next session. " +
            "Be specific: note patterns, topics, personal details, emotional responses, " +
            "or where the student is stuck. Write in third person " +
            "(e.g., 'Student mentioned...', 'Student tends to...'). " +
            "Capture only what's worth carrying forward — skip generic observations.",
        },
        { role: "user", content: context },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Portrait generation failed: ${res.status}`);
  }

  const json = await res.json();
  return (json.choices?.[0]?.message?.content as string | undefined) ?? "";
}

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
    .select("id, essay_mode")
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

  // ── build system prompt (Layer 0: constraints + Layer 1: identity + Layer 2: student) ──
  // inferPhase determines Sam's behavioral mode for this turn. File attachment always
  // triggers FEEDBACK phase regardless of conversation length.
  const mode = (conv.essay_mode ?? "common_app") as EssayMode;
  const phase = inferPhase(history.length, !!safeFileText, mode);
  console.log("[lab/chat] phase", { phase, mode, historyLen: history.length, hasFile: !!safeFileText });

  // Pass isNewConversation so the function can inject the returning-session opener
  // when the student has portrait notes and this is their first message here.
  let systemContent = await buildSystemPromptForUser(user.id, history.length === 0, phase, mode);

  // ── embed once, retrieve playbook + case studies in parallel (Layer 3) ────
  //
  // RAG layers:
  //   Layer 3a — playbook: behavioral rules, techniques to apply NOW
  //   Layer 3b — case studies: past student examples, use as ANALOGY
  //
  // We embed the query once and pass the vector to both typed retrievals
  // to avoid a duplicate embeddings API call.
  // Prefix the RAG query with the mode label so cosine similarity biases
  // toward mode-relevant playbook chunks (e.g. "transfer essay: ..." retrieves
  // fit-framing techniques over personal narrative excavation techniques).
  const ragBaseQuery = safeFileText
    ? `${message}\n\n${safeFileText.slice(0, 1500)}`
    : message;
  const ragQuery =
    mode !== "common_app" ? `${mode.replace("_", " ")} essay: ${ragBaseQuery}` : ragBaseQuery;

  let playbookChunks: string[] = [];
  let caseStudyChunks: string[] = [];

  try {
    const ragVector = await embedQuery(ragQuery);
    [playbookChunks, caseStudyChunks] = await Promise.all([
      retrievePlaybookByVector(ragVector, 3),
      retrieveCaseStudyByVector(ragVector, 2),
    ]);
  } catch {
    // best-effort RAG — proceed without it
  }

  if (playbookChunks.length > 0) {
    systemContent +=
      "\n\n---\nPLAYBOOK TECHNIQUES — APPLY NOW:\n\n" +
      playbookChunks.join("\n\n---\n\n") +
      "\n---";
  }

  if (caseStudyChunks.length > 0) {
    systemContent +=
      "\n\n---\nPAST STUDENT EXAMPLES — REFERENCE AS ANALOGY (not as rules):\n\n" +
      caseStudyChunks.join("\n\n---\n\n") +
      "\n---";
  }

  // ── debug logging ─────────────────────────────────────────────────────────
  if (DEBUG) {
    console.log("[lab/chat/debug] request payload summary", {
      userId: user.id,
      conversationId: conversation_id,
      isNewConversation: history.length === 0,
      systemPromptChars: systemContent.length,
      playbookChunksRetrieved: playbookChunks.length,
      caseStudyChunksRetrieved: caseStudyChunks.length,
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

        // after() side effects (non-blocking, best-effort):
        // 1. persist assistant message
        // 2. debit quota
        // 3. update conversation timestamp
        // 4. generate + write portrait note
        after(async () => {
          // Critical persistence — logged on failure
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
              .update({ updated_at: new Date().toISOString(), session_phase: phase.toLowerCase() })
              .eq("id", conversation_id);
          } catch (persistErr) {
            console.error("Failed to persist chat turn:", persistErr);
          }

          // Portrait note — best-effort, never blocks or throws
          if (accumulated) {
            try {
              // Build context from the last few user turns + this one
              const recentUserMessages = [
                ...history.filter((m) => m.role === "user").slice(-2).map((m) => m.content),
                message,
              ];

              const note = await generatePortraitNote(apiKey, recentUserMessages, accumulated);

              // Fetch current portrait to support rolling cap in writePortraitNote
              const { data: profileRow } = await db
                .from("student_profiles")
                .select("portrait_notes")
                .eq("user_id", user.id)
                .maybeSingle();

              await writePortraitNote(
                user.id,
                profileRow?.portrait_notes ?? null,
                note
              );
            } catch (portraitErr) {
              console.error("[lab/portrait] failed", {
                userId: user.id,
                conversationId: conversation_id,
                error: String(portraitErr),
              });
            }
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

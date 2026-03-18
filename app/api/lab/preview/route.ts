import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { SYSTEM_PROMPT } from "@/lib/agent-system-prompt";

// Simple in-memory rate limiter: IP → { count, windowStart }
const ipRateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const RATE_LIMIT_MAX = 1; // 1 free preview per IP per day

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipRateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count++;
  return false;
}

const PREVIEW_SYSTEM_SUFFIX = `

---

PREVIEW MODE: This is a free one-message preview conversation. The student has not yet signed up.
Give a single, genuine, helpful response that demonstrates your coaching methodology.
Be warm and specific — make it clear you understand their situation.
End with exactly one question that would help you coach them better.
Do not mention that this is a preview or that they should sign up — focus entirely on the student's question.
`;

export async function POST(req: NextRequest) {
  let body: { message?: string; email?: string; teacherSlug?: string };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { message, email, teacherSlug } = body;

  // Validate required fields
  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!email?.trim()) {
    return new Response(JSON.stringify({ error: "email is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: "invalid email" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!teacherSlug?.trim()) {
    return new Response(JSON.stringify({ error: "teacherSlug is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // IP rate limiting
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: "already_used" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "AI service not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const db = getSupabase();

  // Fetch teacher by slug to get agent_config
  const { data: teacher } = await db
    .from("teachers")
    .select("id, name, agent_config")
    .eq("slug", teacherSlug)
    .eq("storefront_published", true)
    .maybeSingle();

  if (!teacher) {
    return new Response(JSON.stringify({ error: "Teacher not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Upsert email into email_subscribers with source = 'preview'
  // Don't fail the request if this errors (email may already exist)
  try {
    await db.from("email_subscribers").upsert(
      { email: email.toLowerCase().trim(), source: "preview" },
      { onConflict: "email", ignoreDuplicates: true }
    );
  } catch {
    // Non-fatal: continue even if email upsert fails
  }

  // Build system prompt: use the Sam Ahn agent system prompt for sam-a,
  // otherwise fall back to a generic prompt with agent_config context
  let systemPrompt: string;
  if (teacherSlug === "sam-a") {
    systemPrompt = SYSTEM_PROMPT + PREVIEW_SYSTEM_SUFFIX;
  } else {
    const agentConfig = teacher.agent_config as Record<string, unknown> | null;
    const configContext = agentConfig && Object.keys(agentConfig).length > 0
      ? `\n\nYour coaching configuration:\n${JSON.stringify(agentConfig, null, 2)}`
      : "";
    systemPrompt =
      `You are ${teacher.name}, a writing and college essay coach. ` +
      `You help students tell their authentic stories in their college applications. ` +
      `You are warm, direct, and deeply invested in each student's success.` +
      configContext +
      PREVIEW_SYSTEM_SUFFIX;
  }

  // Call OpenAI with streaming
  const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 600,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message.trim() },
      ],
    }),
  });

  if (!openAiResponse.ok) {
    const errText = await openAiResponse.text().catch(() => "");
    console.error("OpenAI preview error:", openAiResponse.status, errText);
    return new Response(JSON.stringify({ error: "AI error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Stream the response as plain text (not SSE), so the client can read chunks
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = openAiResponse.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process SSE lines from OpenAI
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;
            if (!trimmed.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(trimmed.slice(6));
              const delta = data.choices?.[0]?.delta?.content;
              if (delta) {
                controller.enqueue(encoder.encode(delta));
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

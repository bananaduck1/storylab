import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SYSTEM_PROMPT = `You are an expert college essay coach at IvyStoryLab. You help high school students discover their authentic stories and write compelling college application essays.

Your approach:
- Ask thoughtful questions to help students uncover meaningful experiences
- Focus on specificity and concrete detail — great essays are about small, specific moments, not grand achievements
- Encourage vulnerability and authenticity over "impressive" topics
- Help students find the narrative arc in their experiences
- Give direct, constructive feedback on drafts
- Coach students to show, not tell

Keep responses warm, encouraging, and focused. When reviewing drafts, be honest and specific about what's working and what needs development. Don't over-praise — students grow from honest feedback delivered with care.`;

export async function POST(request: NextRequest) {
  // Auth check
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages } = await request.json();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response("AI service not configured", { status: 500 });
  }

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
    }),
  });

  if (!openaiRes.ok) {
    const err = await openaiRes.text();
    return new Response(err, { status: openaiRes.status });
  }

  // Stream the text back to the client as plain text
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = openaiRes.body!.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

          for (const line of lines) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const text = json.choices?.[0]?.delta?.content;
              if (text) {
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
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

import { proChatCoach } from "@/src/lib/proChatCoach";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const essayText = body.essay_text;
    if (typeof essayText !== "string" || essayText.trim().length < 10) {
      return NextResponse.json(
        { error: "essay_text is required and must be at least 10 characters" },
        { status: 400 },
      );
    }

    const userMessage = typeof body.user_message === "string"
      ? body.user_message
      : "Please coach me on this essay.";

    // Conversation history: last 10 turns max
    const rawHistory = Array.isArray(body.conversation_history)
      ? body.conversation_history
      : [];
    const conversationHistory = rawHistory
      .filter(
        (m: unknown) =>
          m &&
          typeof m === "object" &&
          "role" in (m as Record<string, unknown>) &&
          "content" in (m as Record<string, unknown>) &&
          ["user", "assistant"].includes(
            (m as Record<string, unknown>).role as string,
          ) &&
          typeof (m as Record<string, unknown>).content === "string",
      )
      .slice(-10) as { role: "user" | "assistant"; content: string }[];

    const result = await proChatCoach(essayText, userMessage, conversationHistory);
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Pro chat error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

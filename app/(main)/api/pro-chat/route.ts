import { proChatCoach } from "@/src/lib/proChatCoach";
import { NextResponse, NextRequest } from "next/server";
import type { ProChatTurnType } from "@/src/lib/types";

// Allow longer execution time for AI responses (60 seconds)
export const maxDuration = 60;

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

    // Turn type: initial_coaching, handoff_first_turn, or followup_response
    let turnType: ProChatTurnType = "initial_coaching";
    if (body.turn_type === "followup_response") {
      turnType = "followup_response";
    } else if (body.turn_type === "handoff_first_turn") {
      turnType = "handoff_first_turn";
    }

    // Coach state for conversational continuity
    const coachState = body.coach_state && typeof body.coach_state === "object"
      ? {
          last_question_asked: typeof body.coach_state.last_question_asked === "string" ? body.coach_state.last_question_asked : "",
          last_user_answer: typeof body.coach_state.last_user_answer === "string" ? body.coach_state.last_user_answer : "",
          current_focus: typeof body.coach_state.current_focus === "string" ? body.coach_state.current_focus : "",
        }
      : undefined;

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

    const result = await proChatCoach(essayText, userMessage, conversationHistory, turnType, coachState);
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Pro chat error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

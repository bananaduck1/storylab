import { loadStoryLabData } from "./loadData";
import { buildProChatPrompt } from "./buildAnalysisPrompt";
import { getOpenAIClient, DEFAULT_ANALYSIS_MODEL } from "./openaiClient";
import { truncateForLogs } from "./redact";
import type { ProChatMessage, ProChatResponse, ProChatTurnType, ProChatState } from "./types";

export async function proChatCoach(
  essayText: string,
  userMessage: string,
  conversationHistory: ProChatMessage[] = [],
  turnType: ProChatTurnType = "initial_coaching",
  coachState?: ProChatState,
): Promise<ProChatResponse> {
  const data = await loadStoryLabData();

  const { messages } = buildProChatPrompt(
    essayText,
    data,
    conversationHistory,
    userMessage,
    turnType,
    coachState,
  );

  const client = await getOpenAIClient();
  const response = await client.chat.completions.create({
    model: DEFAULT_ANALYSIS_MODEL,
    messages,
    temperature: 0.5,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI response has no content");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content.trim());
  } catch {
    throw new Error(
      `Failed to parse Pro chat response as JSON.\n\nResponse (truncated):\n${truncateForLogs(content)}`
    );
  }

  // Validate minimal contract
  if (typeof parsed.coach_message_markdown !== "string" || !parsed.coach_message_markdown) {
    throw new Error("Pro chat response missing coach_message_markdown");
  }

  // Extract coach_state for continuity
  const rawState = parsed.coach_state as Record<string, unknown> | undefined;
  const coachStateOut: ProChatState | undefined = rawState
    ? {
        last_question_asked: typeof rawState.last_question_asked === "string" ? rawState.last_question_asked : "",
        last_user_answer: typeof rawState.last_user_answer === "string" ? rawState.last_user_answer : "",
        current_focus: typeof rawState.current_focus === "string" ? rawState.current_focus : "",
      }
    : undefined;

  // Construct response with safe defaults
  const result: ProChatResponse = {
    mode: "chat",
    coach_message_markdown: parsed.coach_message_markdown as string,
    questions: Array.isArray(parsed.questions)
      ? (parsed.questions as string[])
      : [],
    suggested_next_actions: Array.isArray(parsed.suggested_next_actions)
      ? (parsed.suggested_next_actions as string[])
      : [],
    internal_rubric: (parsed.internal_rubric as ProChatResponse["internal_rubric"]) ?? {
      rubric_scores: [],
      weakest_dimensions: [],
      dominant_misconception: {
        misconception_id: "",
        confidence: 0,
        evidence_spans: [],
        why_this_matters: "",
      },
      recommended_intervention: {
        intervention_id: "",
        rationale: "",
        effort_level: "low",
        output_format: "",
      },
    },
    meta: {
      safety_flags: Array.isArray((parsed.meta as Record<string, unknown>)?.safety_flags)
        ? ((parsed.meta as Record<string, unknown>).safety_flags as string[])
        : [],
      needs_human_escalation: !!(parsed.meta as Record<string, unknown>)?.needs_human_escalation,
      privacy_note: "Do not store essay text.",
      model_limits: "",
    },
    coach_state: coachStateOut,
  };

  return result;
}

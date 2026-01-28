import { loadStoryLabData } from "./loadData";
import { buildProChatPrompt } from "./buildAnalysisPrompt";
import { getOpenAIClient, DEFAULT_ANALYSIS_MODEL } from "./openaiClient";
import { truncateForLogs } from "./redact";
import type { ProChatMessage, ProChatResponse, ProChatTurnType, ProChatState } from "./types";

/**
 * Detect if text starts with a trust-first opener pattern.
 * Patterns: "I trust", "I believe", "I buy", or "I [verb] ... but" structure
 */
function detectsTrustFirstOpener(text: string): boolean {
  const first200 = text.slice(0, 200).toLowerCase();

  // Direct trust phrases
  const trustPhrases = ["i trust", "i believe", "i buy"];
  if (trustPhrases.some(p => first200.startsWith(p) || first200.includes(`. ${p}`) || first200.includes(`\n${p}`))) {
    return true;
  }

  // Pattern: "I [verb] ... but" in first sentence
  const firstSentence = text.split(/[.!?]/)[0] || "";
  const iVerbButPattern = /^i\s+\w+.*\bbut\b/i;
  if (iVerbButPattern.test(firstSentence.trim())) {
    return true;
  }

  return false;
}

/**
 * Get style guardrail if previous response used trust-first opener
 */
function getStyleGuardrail(conversationHistory: ProChatMessage[]): string | null {
  // Find last assistant message
  const lastAssistant = [...conversationHistory].reverse().find(m => m.role === "assistant");
  if (!lastAssistant) return null;

  if (detectsTrustFirstOpener(lastAssistant.content)) {
    return "\n\nSTYLE GUARDRAIL: Your previous reply used a trust-first opener (\"I trust/believe/buy\" or \"I [verb]... but\"). Choose a DIFFERENT opening approach this time — try a specific reader reaction moment, a thesis observation, or a direct question.\n";
  }

  return null;
}

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

  // Inject style guardrail if previous response used trust-first opener
  if (turnType === "followup_response") {
    const guardrail = getStyleGuardrail(conversationHistory);
    if (guardrail && messages.length > 0 && messages[0].role === "system") {
      messages[0].content += guardrail;
    }
  }

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

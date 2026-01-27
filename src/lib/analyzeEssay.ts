import { loadStoryLabData } from "./loadData";
import { buildAnalysisPrompt } from "./buildAnalysisPrompt";
import { getOpenAIClient, DEFAULT_ANALYSIS_MODEL } from "./openaiClient";
import { validateAnalysisOutput } from "./validateAnalysisOutput";
import { truncateForLogs } from "./redact";
import type { AnalysisOutput, CoachingTier } from "./types";

export async function analyzeEssay(essayText: string, tier: CoachingTier = "free"): Promise<AnalysisOutput> {
  // Load data files
  const data = await loadStoryLabData();

  // Build prompts
  const { system, user } = buildAnalysisPrompt(essayText, data, tier);

  // Debug: confirm prompt contents
  const hasPreserveFirstScoring = system.includes("PRESERVE-FIRST SCORING (MANDATORY)");
  console.log("Prompt contains PRESERVE-FIRST SCORING (MANDATORY):", hasPreserveFirstScoring);

  // Call OpenAI
  const client = await getOpenAIClient();
  const response = await client.chat.completions.create({
    model: DEFAULT_ANALYSIS_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  // Extract content
  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI response has no content");
  }

  // Parse JSON (strip leading/trailing whitespace)
  let parsed: unknown;
  try {
    const trimmed = content.trim();
    
    // Check for concatenated JSON objects
    if (trimmed.includes("}{")) {
      throw new Error(
        "Model returned multiple JSON objects; expected exactly one.\n\nResponse (truncated):\n" +
          truncateForLogs(content)
      );
    }
    
    parsed = JSON.parse(trimmed);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Model returned multiple JSON objects")) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown JSON parse error";
    throw new Error(
      `Failed to parse OpenAI response as JSON: ${errorMessage}\n\nResponse (truncated):\n${truncateForLogs(content)}`
    );
  }
  
  // Check for unknown keys in student_output
  if (parsed && typeof parsed === "object" && "student_output" in parsed) {
    const studentOutput = (parsed as Record<string, unknown>).student_output;
    if (studentOutput && typeof studentOutput === "object") {
      const allowedKeys = [
        "headline",
        "what_to_fix_first",
        "brief_explanation",
        "concept_taught",
        "one_assignment",
        "optional_next_step",
        "revision_paths",
        "questions_for_student",
      ];
      const studentOutputObj = studentOutput as Record<string, unknown>;
      const unknownKeys = Object.keys(studentOutputObj).filter(
        (key) => !allowedKeys.includes(key)
      );
      if (unknownKeys.length > 0) {
        throw new Error(
          `Unknown keys in student_output: ${unknownKeys.join(", ")}. Allowed keys: ${allowedKeys.join(", ")}.\n\nResponse (truncated):\n${truncateForLogs(content)}`
        );
      }
    }
  }

  // Validate output
  const validation = validateAnalysisOutput(parsed, data);
  if (!validation.ok) {
    throw new Error(
      `Analysis output validation failed:\n${validation.errors.join("\n")}\n\nRaw response (truncated):\n${truncateForLogs(content)}`
    );
  }

  return validation.value;
}

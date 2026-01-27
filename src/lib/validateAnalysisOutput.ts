import type { AnalysisOutput, StoryLabData } from "./types";

export function validateAnalysisOutput(
  obj: unknown,
  data: StoryLabData
): { ok: true; value: AnalysisOutput } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  if (!obj || typeof obj !== "object") {
    return { ok: false, errors: ["Output is not an object"] };
  }

  const o = obj as Record<string, unknown>;

  // Check top-level keys
  if (typeof o.schema_version !== "string") {
    errors.push("schema_version must be a string");
  }
  if (!o.analysis || typeof o.analysis !== "object") {
    errors.push("analysis must be an object");
  }
  if (!o.student_output || typeof o.student_output !== "object") {
    errors.push("student_output must be an object");
  }
  if (!o.meta || typeof o.meta !== "object") {
    errors.push("meta must be an object");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const analysis = o.analysis as Record<string, unknown>;
  const studentOutput = o.student_output as Record<string, unknown>;
  const meta = o.meta as Record<string, unknown>;

  // Validate rubric_scores
  if (!Array.isArray(analysis.rubric_scores)) {
    errors.push("analysis.rubric_scores must be an array");
  } else {
    const rubricScores = analysis.rubric_scores as unknown[];
    const expectedIds = data.analysisSchema.allowed_values.rubric_ids;
    const foundIds = new Set<string>();

    if (rubricScores.length !== 8) {
      errors.push(`analysis.rubric_scores must have exactly 8 items, found ${rubricScores.length}`);
    }

    rubricScores.forEach((score, index) => {
      if (typeof score !== "object" || score === null) {
        errors.push(`analysis.rubric_scores[${index}] must be an object`);
        return;
      }

      const s = score as Record<string, unknown>;
      const rubricId = s.rubric_id;

      if (typeof rubricId !== "string") {
        errors.push(`analysis.rubric_scores[${index}].rubric_id must be a string`);
      } else {
        if (!expectedIds.includes(rubricId)) {
          errors.push(
            `analysis.rubric_scores[${index}].rubric_id "${rubricId}" is not a valid rubric ID`
          );
        }
        if (foundIds.has(rubricId)) {
          errors.push(`analysis.rubric_scores has duplicate rubric_id "${rubricId}"`);
        }
        foundIds.add(rubricId);
      }

      const scoreValue = s.score;
      if (typeof scoreValue !== "number" || !Number.isInteger(scoreValue)) {
        errors.push(`analysis.rubric_scores[${index}].score must be an integer`);
      } else if (scoreValue < 1 || scoreValue > 5) {
        errors.push(`analysis.rubric_scores[${index}].score must be between 1 and 5`);
      }

      if (!Array.isArray(s.evidence_spans)) {
        errors.push(`analysis.rubric_scores[${index}].evidence_spans must be an array`);
      } else {
        s.evidence_spans.forEach((span: unknown, spanIndex: number) => {
          if (typeof span !== "object" || span === null) {
            errors.push(
              `analysis.rubric_scores[${index}].evidence_spans[${spanIndex}] must be an object`
            );
            return;
          }
          const sp = span as Record<string, unknown>;
          if (typeof sp.quote !== "string") {
            errors.push(
              `analysis.rubric_scores[${index}].evidence_spans[${spanIndex}].quote must be a string`
            );
          }
          if (typeof sp.why_it_matters !== "string") {
            errors.push(
              `analysis.rubric_scores[${index}].evidence_spans[${spanIndex}].why_it_matters must be a string`
            );
          }
        });
      }

      if (typeof s.notes !== "string") {
        errors.push(`analysis.rubric_scores[${index}].notes must be a string`);
      }
    });

    // Check all expected IDs are present
    expectedIds.forEach((id) => {
      if (!foundIds.has(id)) {
        errors.push(`Missing rubric_id "${id}" in analysis.rubric_scores`);
      }
    });

    // Cross-rubric sanity check: if R003 >= 4 AND R004 >= 4 AND R005 >= 4, then R002 cannot be <= 2
    // unless R002 notes explicitly cite a contradiction with evidence
    const scoreMap = new Map<string, { score: number; evidence_spans: unknown[]; notes: string }>();
    rubricScores.forEach((item) => {
      const s = item as Record<string, unknown>;
      if (typeof s.rubric_id === "string" && typeof s.score === "number") {
        scoreMap.set(s.rubric_id, {
          score: s.score,
          evidence_spans: Array.isArray(s.evidence_spans) ? s.evidence_spans : [],
          notes: typeof s.notes === "string" ? s.notes : "",
        });
      }
    });

    const r002 = scoreMap.get("R002");
    const r003 = scoreMap.get("R003");
    const r004 = scoreMap.get("R004");
    const r005 = scoreMap.get("R005");
    if (
      r002 && r003 && r004 && r005 &&
      r003.score >= 4 && r004.score >= 4 && r005.score >= 4 &&
      r002.score <= 2
    ) {
      // R002 <= 2 is only valid if evidence_spans cite a specific contradiction
      if (r002.evidence_spans.length === 0) {
        errors.push(
          "Cross-rubric sanity: R003 >= 4, R004 >= 4, R005 >= 4 but R002 <= 2 with no evidence_spans. " +
          "An essay that is specific, insightful, and shows rather than tells must have some psychological depth. " +
          "Either raise R002 or provide explicit evidence of a contradiction."
        );
      }
    }
  }

  // Validate weakest_dimensions
  if (!Array.isArray(analysis.weakest_dimensions)) {
    errors.push("analysis.weakest_dimensions must be an array");
  } else {
    const weakest = analysis.weakest_dimensions as unknown[];
    if (weakest.length < 1 || weakest.length > 3) {
      errors.push("analysis.weakest_dimensions must be 1–3 rubric IDs (R001–R008).");
    }
    weakest.forEach((dim, index) => {
      if (typeof dim !== "string") {
        errors.push(`analysis.weakest_dimensions[${index}] must be a string`);
      } else if (!data.analysisSchema.allowed_values.rubric_ids.includes(dim)) {
        errors.push(`analysis.weakest_dimensions[${index}] "${dim}" is not a valid rubric ID`);
      }
    });
  }

  // Validate dominant_misconception
  if (!analysis.dominant_misconception || typeof analysis.dominant_misconception !== "object") {
    errors.push("analysis.dominant_misconception must be an object");
  } else {
    const dm = analysis.dominant_misconception as Record<string, unknown>;
    const misconceptionId = dm.misconception_id;
    if (typeof misconceptionId !== "string") {
      errors.push("analysis.dominant_misconception.misconception_id must be a string");
    } else {
      const exists = data.misconceptions.misconceptions.some((m) => m.id === misconceptionId);
      if (!exists) {
        errors.push(
          `analysis.dominant_misconception.misconception_id "${misconceptionId}" does not exist in misconceptions.json`
        );
      }
    }

    const confidence = dm.confidence;
    if (typeof confidence !== "number") {
      errors.push("analysis.dominant_misconception.confidence must be a number");
    } else if (confidence < 0 || confidence > 1) {
      errors.push("analysis.dominant_misconception.confidence must be between 0 and 1");
    }

    if (!Array.isArray(dm.evidence_spans)) {
      errors.push("analysis.dominant_misconception.evidence_spans must be an array");
    } else {
      dm.evidence_spans.forEach((span: unknown, index: number) => {
        if (typeof span !== "object" || span === null) {
          errors.push(`analysis.dominant_misconception.evidence_spans[${index}] must be an object`);
          return;
        }
        const sp = span as Record<string, unknown>;
        if (typeof sp.quote !== "string") {
          errors.push(`analysis.dominant_misconception.evidence_spans[${index}].quote must be a string`);
        }
        if (typeof sp.why_it_matters !== "string") {
          errors.push(
            `analysis.dominant_misconception.evidence_spans[${index}].why_it_matters must be a string`
          );
        }
      });
    }

    if (typeof dm.why_this_matters !== "string") {
      errors.push("analysis.dominant_misconception.why_this_matters must be a string");
    }
  }

  // Validate recommended_intervention
  if (
    !analysis.recommended_intervention ||
    typeof analysis.recommended_intervention !== "object"
  ) {
    errors.push("analysis.recommended_intervention must be an object");
  } else {
    const ri = analysis.recommended_intervention as Record<string, unknown>;
    const interventionId = ri.intervention_id;
    if (typeof interventionId !== "string") {
      errors.push("analysis.recommended_intervention.intervention_id must be a string");
    } else {
      const intervention = data.interventions.interventions.find((i) => i.id === interventionId);
      if (!intervention) {
        errors.push(
          `analysis.recommended_intervention.intervention_id "${interventionId}" does not exist in interventions.json`
        );
      } else {
        // Validate output_format matches exactly
        const outputFormat = ri.output_format;
        if (typeof outputFormat !== "string") {
          errors.push("analysis.recommended_intervention.output_format must be a string");
        } else if (outputFormat !== intervention.output_format) {
          errors.push(
            `analysis.recommended_intervention.output_format does not match the intervention's output_format in interventions.json`
          );
        }
      }
    }

    if (typeof ri.rationale !== "string") {
      errors.push("analysis.recommended_intervention.rationale must be a string");
    }

    const effortLevel = ri.effort_level;
    if (typeof effortLevel !== "string") {
      errors.push("analysis.recommended_intervention.effort_level must be a string");
    } else if (!["low", "medium", "high"].includes(effortLevel)) {
      errors.push(
        `analysis.recommended_intervention.effort_level must be one of: low, medium, high`
      );
    }
  }

  // Validate student_output
  const requiredStudentFields = [
    "headline",
    "what_to_fix_first",
    "brief_explanation",
    "one_assignment",
    "optional_next_step",
  ];
  requiredStudentFields.forEach((field) => {
    if (!(field in studentOutput)) {
      errors.push(`student_output.${field} is required`);
    }
  });

  if (studentOutput.one_assignment) {
    const assignment = studentOutput.one_assignment as Record<string, unknown>;
    const requiredAssignmentFields = ["title", "instructions", "time_estimate_minutes", "success_check"];
    requiredAssignmentFields.forEach((field) => {
      if (!(field in assignment)) {
        errors.push(`student_output.one_assignment.${field} is required`);
      }
    });
    if (typeof assignment.time_estimate_minutes !== "number") {
      errors.push("student_output.one_assignment.time_estimate_minutes must be a number");
    }
  }

  // Validate meta
  if (!Array.isArray(meta.safety_flags)) {
    errors.push("meta.safety_flags must be an array");
  }
  if (typeof meta.needs_human_escalation !== "boolean") {
    errors.push("meta.needs_human_escalation must be a boolean");
  }
  if (typeof meta.privacy_note !== "string") {
    errors.push("meta.privacy_note must be a string");
  }
  if (typeof meta.model_limits !== "string") {
    errors.push("meta.model_limits must be a string");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: obj as AnalysisOutput };
}

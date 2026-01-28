export type RubricDimension = {
  id: string;
  name: string;
  description: string;
  scale: {
    min: number;
    max: number;
  };
  score_2: string;
  score_5: string;
  diagnostic_question: string;
};

export type RubricFile = {
  version: string;
  source?: {
    doc?: string;
    notes?: string;
  };
  dimensions: RubricDimension[];
};

export type Misconception = {
  id: string;
  label: string;
  belief: string;
  reality: string;
  signals_in_text: string[];
  best_interventions: string[];
};

export type MisconceptionsFile = {
  version: string;
  source?: {
    doc?: string;
    notes?: string;
  };
  misconceptions: Misconception[];
};

export type Intervention = {
  id: string;
  target_misconception: string;
  type: "question" | "constraint" | "cut" | "example";
  name: string;
  description: string;
  intended_effect: string;
  when_to_use: string;
  effort_level: "low" | "medium" | "high";
  output_format: string;
};

export type InterventionsFile = {
  version: string;
  source?: {
    doc?: string;
    notes?: string;
  };
  interventions: Intervention[];
};

export type AnalysisSchema = {
  schema_version: string;
  description?: string;
  allowed_values: {
    rubric_ids: string[];
    score_range: {
      min: number;
      max: number;
    };
    intervention_types: string[];
    effort_levels: string[];
    confidence_range: {
      min: number;
      max: number;
    };
  };
  required_structure: Record<string, unknown>;
  example_output?: Record<string, unknown>;
};

export type RubricToMisconceptions = Record<string, string[]>;

export type EvidenceSpan = {
  quote: string;
  why_it_matters: string;
};

export type RubricScore = {
  rubric_id: string;
  score: number;
  evidence_spans: EvidenceSpan[];
  notes: string;
};

export type DominantMisconception = {
  misconception_id: string;
  confidence: number;
  evidence_spans: EvidenceSpan[];
  why_this_matters: string;
};

export type RecommendedIntervention = {
  intervention_id: string;
  rationale: string;
  effort_level: "low" | "medium" | "high";
  output_format: string;
};

export type Analysis = {
  rubric_scores: RubricScore[];
  weakest_dimensions: string[];
  dominant_misconception: DominantMisconception;
  recommended_intervention: RecommendedIntervention;
};

export type OneAssignment = {
  title: string;
  instructions: string;
  time_estimate_minutes: number;
  success_check: string;
};

export type CoachingTier = "free" | "plus" | "pro";

export type RevisionPath = {
  label: string;
  description: string;
};

export type StudentOutput = {
  headline: string;
  what_to_fix_first: string;
  brief_explanation: string;
  no_ghostwriting_note: string;
  one_assignment: OneAssignment;
  optional_next_step: string;
  concept_taught: string;
  revision_paths: RevisionPath[];
  questions_for_student: string[];
};

export type Meta = {
  safety_flags: string[];
  needs_human_escalation: boolean;
  privacy_note: string;
  model_limits: string;
};

export type AnalysisOutput = {
  schema_version: string;
  analysis: Analysis;
  student_output: StudentOutput;
  meta: Meta;
};

// ── Pro chat types ──

export type ProChatTurnType = "initial_coaching" | "followup_response";

export type ProChatState = {
  last_question_asked: string;
  last_user_answer: string;
  current_focus: string;
};

export type ProChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ProChatResponse = {
  mode: "chat";
  coach_message_markdown: string;
  questions: string[];
  suggested_next_actions: string[];
  internal_rubric: Analysis;
  meta: Meta;
  coach_state?: ProChatState;
};

export type StoryLabData = {
  rubric: RubricFile;
  misconceptions: MisconceptionsFile;
  interventions: InterventionsFile;
  rubricToMisconceptions: RubricToMisconceptions;
  analysisSchema: AnalysisSchema;
};

import { readFile } from "fs/promises";
import { join } from "path";
import type {
  StoryLabData,
  RubricFile,
  MisconceptionsFile,
  InterventionsFile,
  AnalysisSchema,
  RubricToMisconceptions,
} from "./types";

const DATA_DIR = join(process.cwd(), "data");

async function loadJsonFile<T>(filename: string): Promise<T> {
  const filePath = join(DATA_DIR, filename);
  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    if (error instanceof Error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(`Missing data file: ${filename}`);
      }
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in ${filename}: ${error.message}`);
      }
    }
    throw error;
  }
}

export async function loadStoryLabData(): Promise<StoryLabData> {
  // Load all files in parallel
  const [rubric, misconceptions, interventions, rubricToMisconceptions, analysisSchema] =
    await Promise.all([
      loadJsonFile<RubricFile>("rubric.json"),
      loadJsonFile<MisconceptionsFile>("misconceptions.json"),
      loadJsonFile<InterventionsFile>("interventions.json"),
      loadJsonFile<RubricToMisconceptions>("rubric_to_misconceptions.json"),
      loadJsonFile<AnalysisSchema>("analysis_schema.json"),
    ]);

  // Validate required top-level keys
  if (!rubric.dimensions || !Array.isArray(rubric.dimensions)) {
    throw new Error("rubric.json must have { dimensions: [...] }");
  }

  if (
    !misconceptions.misconceptions ||
    !Array.isArray(misconceptions.misconceptions)
  ) {
    throw new Error("misconceptions.json must have { misconceptions: [...] }");
  }

  if (!interventions.interventions || !Array.isArray(interventions.interventions)) {
    throw new Error("interventions.json must have { interventions: [...] }");
  }

  if (
    typeof rubricToMisconceptions !== "object" ||
    rubricToMisconceptions === null ||
    Array.isArray(rubricToMisconceptions)
  ) {
    throw new Error(
      "rubric_to_misconceptions.json must be an object mapping rubric IDs to arrays of misconception IDs"
    );
  }

  if (
    !analysisSchema.schema_version ||
    !analysisSchema.required_structure ||
    !analysisSchema.allowed_values
  ) {
    throw new Error(
      "analysis_schema.json must have { schema_version: ..., required_structure: ..., allowed_values: ... }"
    );
  }

  return {
    rubric,
    misconceptions,
    interventions,
    rubricToMisconceptions,
    analysisSchema,
  };
}

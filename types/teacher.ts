export type Subject =
  | "Math"
  | "English/Writing"
  | "Science"
  | "History"
  | "Languages"
  | "Test Prep"
  | "Other";

export const SUBJECT_VALUES: Subject[] = [
  "Math",
  "English/Writing",
  "Science",
  "History",
  "Languages",
  "Test Prep",
  "Other",
];

export function isWritingSubject(subject: string | null | undefined): boolean {
  return subject === "English/Writing";
}

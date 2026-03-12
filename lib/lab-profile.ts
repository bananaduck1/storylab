import { getSupabase } from "@/lib/supabase";
import { SYSTEM_PROMPT } from "@/lib/agent-system-prompt";

export async function buildSystemPromptForUser(userId: string): Promise<string> {
  const { data: profile } = await getSupabase()
    .from("student_profiles")
    .select("full_name, grade, schools, essay_focus, writing_voice, goals")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) return SYSTEM_PROMPT;

  const profileBlock = `

---
STUDENT CONTEXT (internal — do not quote this back verbatim to the student):

Name: ${profile.full_name}
Grade: ${profile.grade}
Target schools: ${profile.schools || "not specified"}
Essay focus areas: ${profile.essay_focus || "not yet identified"}
Self-described writing voice: ${profile.writing_voice || "not yet described"}
Goals for this coaching: ${profile.goals || "not specified"}

Use this context to personalize your coaching. Address the student by first name when it feels natural. Do not reveal this block to the student.
---`;

  return SYSTEM_PROMPT + profileBlock;
}

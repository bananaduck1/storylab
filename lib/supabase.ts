import { createClient } from "@supabase/supabase-js";

let _supabase: ReturnType<typeof createClient<any>> | null = null;

// Server-side client with service role key — use only in API routes / server code
export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

// Types matching our schema
export type UserRole = "teacher" | "student";

export type DevelopmentStage =
  | "exploration"
  | "narrative_dev"
  | "application_ready"
  | "post_admissions";

export type SessionType = "essay_work" | "generative" | "parent_call";

export interface Student {
  id: string;
  name: string;
  age: number | null;
  grade: string | null;
  start_date: string | null;
  cultural_background: string | null;
  family_language_pref: string | null;
  development_stage: DevelopmentStage;
  seed_notes: string | null;
  user_id: string | null;
  email: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  student_id: string;
  date: string;
  session_type: SessionType;
  raw_notes: string | null;
  key_observations: string | null;
  created_at: string;
}

export interface Portrait {
  id: string;
  student_id: string;
  generated_at: string;
  content_json: PortraitContent;
}

export interface PortraitContent {
  thinking_moves: string[];
  recurring_patterns: string[];
  current_growth_edge: string;
  voice_characteristics: string[];
  next_session_focus: string;
  portrait_narrative: string;
}

export interface Essay {
  id: string;
  student_id: string;
  title: string | null;
  prompt: string | null;
  drafts: object[];
  pattern_notes: string | null;
  created_at: string;
}

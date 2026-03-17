-- Add AI-written portrait notes to student profiles.
-- portrait_notes is append-only free text, written by the agent after each conversation.
-- Nullable: null means no conversations yet. Rolling cap enforced in application code.
ALTER TABLE student_profiles ADD COLUMN portrait_notes text;

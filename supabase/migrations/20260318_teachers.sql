-- Multi-tenant teacher foundation.
-- Creates the teachers table and adds teacher_id to knowledge_chunks + student_profiles.
-- Sam Ahn is backfilled as the first teacher.
-- The match_knowledge_chunks RPC is updated to support per-teacher filtering.

-- ── teachers table ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS teachers (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  name         text        NOT NULL,
  -- Structured agent config. Fields:
  --   identity       (string) — who the teacher is, their origin story
  --   core_beliefs   (string) — what they believe about writing/their subject
  --   diagnostic_eye (string) — what they notice in bad drafts
  --   voice          (string) — how they talk to students, tone, style
  --   signature_moves (string[]) — 3-5 coaching moves they always make
  -- NULL or empty {} means: fall back to the hardcoded SYSTEM_PROMPT file.
  agent_config jsonb       NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER teachers_updated_at
  BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ── teacher_id columns ────────────────────────────────────────────────────────

ALTER TABLE knowledge_chunks
  ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES teachers(id);

-- Index before backfill so the UPDATE uses it
CREATE INDEX IF NOT EXISTS knowledge_chunks_teacher_id
  ON knowledge_chunks(teacher_id);

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES teachers(id);

CREATE INDEX IF NOT EXISTS student_profiles_teacher_id
  ON student_profiles(teacher_id);

-- ── backfill Sam Ahn as teacher row 1 ─────────────────────────────────────────
-- Uses email lookup so no UUID is hardcoded. ON CONFLICT DO NOTHING = idempotent.

INSERT INTO teachers (name, user_id)
SELECT 'Sam Ahn', id
FROM auth.users
WHERE email = 'samahn240@gmail.com'
ON CONFLICT DO NOTHING;

-- Backfill all existing knowledge_chunks + student_profiles to Sam.
-- WHERE teacher_id IS NULL makes this idempotent on re-run.

UPDATE knowledge_chunks
SET teacher_id = (SELECT id FROM teachers WHERE name = 'Sam Ahn')
WHERE teacher_id IS NULL;

UPDATE student_profiles
SET teacher_id = (SELECT id FROM teachers WHERE name = 'Sam Ahn')
WHERE teacher_id IS NULL;

-- ── update match_knowledge_chunks RPC ─────────────────────────────────────────
-- Add filter_teacher_id (DEFAULT NULL) so callers can scope retrieval to a teacher.
-- When NULL: returns all chunks (backward compat).
-- When set: returns chunks for that teacher OR chunks with no teacher assigned (legacy).
--
-- PostgreSQL requires DROP + CREATE to change a function's parameter list.
-- The new parameter has DEFAULT NULL so all existing callers continue to work.

DROP FUNCTION IF EXISTS match_knowledge_chunks(vector, integer, text);
DROP FUNCTION IF EXISTS match_knowledge_chunks(vector(1536), integer, text);

CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding  vector(1536),
  match_count      integer,
  filter_chunk_type text DEFAULT NULL,
  filter_teacher_id uuid  DEFAULT NULL
)
RETURNS TABLE (
  id          uuid,
  content     text,
  source_doc  text,
  chunk_type  text,
  metadata    jsonb,
  similarity  float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.content,
    kc.source_doc,
    kc.chunk_type,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE
    (filter_chunk_type IS NULL OR kc.chunk_type = filter_chunk_type)
    AND (
      filter_teacher_id IS NULL
      OR kc.teacher_id = filter_teacher_id
      OR kc.teacher_id IS NULL  -- legacy chunks with no teacher still surface
    )
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

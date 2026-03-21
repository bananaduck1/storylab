-- Teacher capacity toggle + waitlist (TODO-33).

-- ── accepting_students on teachers ─────────────────────────────────────────
-- Default TRUE — existing teachers remain open to new students.
ALTER TABLE teachers
  ADD COLUMN IF NOT EXISTS accepting_students BOOLEAN NOT NULL DEFAULT true;

-- ── teacher_waitlist ────────────────────────────────────────────────────────
-- Stores prospective student emails for teachers at capacity.
-- UNIQUE(teacher_id, student_email) prevents duplicate submissions.
-- status: 'waiting' (default) | 'notified' (batch email sent when teacher re-opens)
CREATE TABLE teacher_waitlist (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id     UUID        NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_email  TEXT        NOT NULL,
  student_name   TEXT,
  note           TEXT,
  status         TEXT        NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'notified')),
  notified_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, student_email)
);

CREATE INDEX teacher_waitlist_teacher_id_idx ON teacher_waitlist(teacher_id);
CREATE INDEX teacher_waitlist_status_idx     ON teacher_waitlist(teacher_id, status)
  WHERE status = 'waiting';

ALTER TABLE teacher_waitlist ENABLE ROW LEVEL SECURITY;

-- Public: anyone can join a waitlist (no auth required)
CREATE POLICY teacher_waitlist_insert_public
  ON teacher_waitlist FOR INSERT
  WITH CHECK (true);

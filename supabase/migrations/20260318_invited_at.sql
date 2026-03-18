-- Add invite tracking to the students table.
-- invited_at: timestamp when the invite email was sent.

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS invited_at timestamptz;

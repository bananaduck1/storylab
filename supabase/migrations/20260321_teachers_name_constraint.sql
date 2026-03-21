-- Enforce non-empty teacher names.
-- teachers.name is already NOT NULL (from 20260318_teachers.sql).
-- This adds a CHECK constraint to prevent blank/whitespace-only names,
-- which would produce empty strings in dynamic teacher name UI surfaces.

ALTER TABLE teachers
  ADD CONSTRAINT teachers_name_not_empty CHECK (trim(name) <> '');

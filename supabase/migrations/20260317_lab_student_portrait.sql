-- Student-facing profile card fields.
-- Favorites are self-reported (book, movie, song).
-- Strengths/growth are AI-extracted from portrait_notes on demand.
-- portrait_summary_updated_at is the staleness signal for on-demand extraction.
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS favorites_book   TEXT,
  ADD COLUMN IF NOT EXISTS favorites_movie  TEXT,
  ADD COLUMN IF NOT EXISTS favorites_song   TEXT,
  ADD COLUMN IF NOT EXISTS strengths_notes  TEXT,
  ADD COLUMN IF NOT EXISTS growth_notes     TEXT,
  ADD COLUMN IF NOT EXISTS portrait_summary_updated_at TIMESTAMPTZ;

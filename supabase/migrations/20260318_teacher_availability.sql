-- Per-teacher availability: add teacher_id FK to availability and bookings tables
-- Backfill all existing slots to Sam Ahn (the only teacher at launch)

-- Add teacher_id to availability
ALTER TABLE availability ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES teachers(id);

-- Add teacher_id to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES teachers(id);

-- Add calendar config and booking toggle to teachers
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS google_calendar_id text;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS accepting_bookings boolean NOT NULL DEFAULT false;

-- Backfill: all existing availability/booking rows belong to Sam
UPDATE availability
  SET teacher_id = (SELECT id FROM teachers WHERE slug = 'sam-a' LIMIT 1)
  WHERE teacher_id IS NULL;

UPDATE bookings
  SET teacher_id = (SELECT id FROM teachers WHERE slug = 'sam-a' LIMIT 1)
  WHERE teacher_id IS NULL;

-- Backfill Sam's google_calendar_id from env (we store NULL here; cron reads env for backward compat)
-- We set accepting_bookings = true for Sam since he has active slots
UPDATE teachers
  SET accepting_bookings = true
  WHERE slug = 'sam-a';

-- Index for fast per-teacher slot queries
CREATE INDEX IF NOT EXISTS availability_teacher_datetime
  ON availability (teacher_id, datetime)
  WHERE is_booked = false;

-- RLS: public can read future available slots (already existed, add teacher_id awareness)
-- The existing "Public read available slots" policy covers this since it's SELECT-only
-- No policy change needed — teacher_id is a filter applied in queries, not a security boundary
-- (booking page is public by design; teacher_id comes from the slug URL)

-- Add index on bookings.teacher_id for fast per-teacher cron queries
CREATE INDEX IF NOT EXISTS bookings_teacher_id
  ON bookings (teacher_id);

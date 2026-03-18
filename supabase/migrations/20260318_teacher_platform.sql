-- Teacher platform: add email/subject to teachers, teacher_id to students/sessions/portraits

-- ── teachers table additions ─────────────────────────────────────────────────

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS subject text;

-- Backfill email from auth.users for existing teacher rows
UPDATE teachers t
SET email = u.email
FROM auth.users u
WHERE t.user_id = u.id AND t.email IS NULL;

-- Now enforce NOT NULL (all existing rows have email from backfill)
ALTER TABLE teachers ALTER COLUMN email SET NOT NULL;

-- RLS: teachers can read their own row (middleware uses anon client)
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "teachers_self_select" ON teachers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "teachers_self_insert" ON teachers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "teachers_self_update" ON teachers
  FOR UPDATE USING (auth.uid() = user_id);

-- ── students.teacher_id ───────────────────────────────────────────────────────

ALTER TABLE students ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES teachers(id);
CREATE INDEX IF NOT EXISTS students_teacher_id ON students(teacher_id);

-- Backfill existing students to Sam Ahn
UPDATE students
SET teacher_id = (SELECT id FROM teachers WHERE name = 'Sam Ahn' LIMIT 1)
WHERE teacher_id IS NULL;

-- ── sessions.teacher_id ───────────────────────────────────────────────────────

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES teachers(id);
CREATE INDEX IF NOT EXISTS sessions_teacher_id ON sessions(teacher_id);

-- Backfill sessions via students.teacher_id
UPDATE sessions s
SET teacher_id = (SELECT teacher_id FROM students WHERE id = s.student_id)
WHERE s.teacher_id IS NULL;

-- ── portraits.teacher_id ──────────────────────────────────────────────────────

ALTER TABLE portraits ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES teachers(id);
CREATE INDEX IF NOT EXISTS portraits_teacher_id ON portraits(teacher_id);

-- Backfill portraits via students.teacher_id
UPDATE portraits p
SET teacher_id = (SELECT teacher_id FROM students WHERE id = p.student_id)
WHERE p.teacher_id IS NULL;

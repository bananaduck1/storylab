-- org_teachers: junction table for teacher <-> org membership
CREATE TABLE IF NOT EXISTS org_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS org_teachers_org_id ON org_teachers(org_id);
CREATE INDEX IF NOT EXISTS org_teachers_teacher_id ON org_teachers(teacher_id);

ALTER TABLE org_teachers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'org_teachers' AND policyname = 'org_teachers_select'
  ) THEN
    CREATE POLICY "org_teachers_select" ON org_teachers
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM org_teachers ot2
          JOIN teachers t ON t.id = ot2.teacher_id
          WHERE ot2.org_id = org_teachers.org_id AND t.user_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM students s
          WHERE s.org_id = org_teachers.org_id AND s.user_id = auth.uid()
            AND s.org_membership_status = 'active'
        )
      );
  END IF;
END $$;

-- Add org membership to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS org_membership_status TEXT CHECK (org_membership_status IN ('active', 'pending'));

CREATE INDEX IF NOT EXISTS students_org_id ON students(org_id) WHERE org_id IS NOT NULL;

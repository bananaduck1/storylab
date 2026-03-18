-- Indexes for getUserRoles() lookups — both queries run on every auth'd page load.
-- Without these, each is a full table scan.
CREATE INDEX IF NOT EXISTS teachers_user_id ON teachers(user_id);
CREATE INDEX IF NOT EXISTS students_user_id  ON students(user_id);

-- Backfill Sam's subject so teacher context injection has a value to use.
UPDATE teachers SET subject = 'college essay writing' WHERE subject IS NULL;

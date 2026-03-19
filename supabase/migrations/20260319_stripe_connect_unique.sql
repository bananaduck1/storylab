-- Unique constraint on stripe_account_id prevents concurrent onboarding calls
-- from creating duplicate Express accounts for the same teacher.
CREATE UNIQUE INDEX IF NOT EXISTS teachers_stripe_account_id_unique
  ON teachers (stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;

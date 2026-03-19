-- Add Stripe Connect fields to teachers table
-- stripe_account_id: the Express connected account ID (acct_xxx), null until onboarding starts
-- stripe_onboarding_complete: true once charges_enabled AND details_submitted via webhook

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT false;

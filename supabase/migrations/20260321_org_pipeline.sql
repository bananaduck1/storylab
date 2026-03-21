-- B2B pipeline columns on organizations (TODO-49/50).
-- Pipeline is a lightweight CRM for tracking prospective institutional partners.
-- Revenue summary JOINs org_subscriptions (existing table) — not a new column.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS pipeline_stage    TEXT    DEFAULT 'prospect'
    CHECK (pipeline_stage IN ('prospect', 'demo_scheduled', 'proposal_sent', 'negotiating', 'closed_won', 'closed_lost')),
  ADD COLUMN IF NOT EXISTS pipeline_notes    TEXT,
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contact_email     TEXT,
  ADD COLUMN IF NOT EXISTS deal_notes        TEXT,
  ADD COLUMN IF NOT EXISTS pricing_tier      TEXT    DEFAULT 'standard'
    CHECK (pricing_tier IN ('standard', 'enterprise', 'pilot'));

-- Index for inactivity alert query (60-day filter in pipeline table)
CREATE INDEX IF NOT EXISTS organizations_last_contacted_at_idx
  ON organizations(last_contacted_at)
  WHERE last_contacted_at IS NOT NULL;

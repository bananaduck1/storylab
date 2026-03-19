-- org_subscriptions: Stripe SaaS subscription per org (platform access fee)
-- Completely separate from Stripe Connect per-session billing
CREATE TABLE IF NOT EXISTS org_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'past_due', 'canceled', 'inactive')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS org_subscriptions_org_id ON org_subscriptions(org_id);
CREATE INDEX IF NOT EXISTS org_subscriptions_stripe_sub ON org_subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

ALTER TABLE org_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'org_subscriptions' AND policyname = 'org_subscription_select'
  ) THEN
    CREATE POLICY "org_subscription_select" ON org_subscriptions
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM org_teachers ot
          JOIN teachers t ON t.id = ot.teacher_id
          WHERE ot.org_id = org_subscriptions.org_id
            AND t.user_id = auth.uid()
            AND ot.role = 'admin'
        )
      );
  END IF;
END $$;

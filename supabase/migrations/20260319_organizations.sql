-- Organizations: B2B institutional hub
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  email_domain TEXT, -- soft domain auto-join (pending approval)
  ai_context TEXT,   -- injected into /lab system prompt for org students
  logo_url TEXT,
  primary_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS organizations_email_domain ON organizations(email_domain) WHERE email_domain IS NOT NULL;

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

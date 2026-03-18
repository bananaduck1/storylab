-- Add source column to email_subscribers for tracking signup origin
ALTER TABLE email_subscribers ADD COLUMN IF NOT EXISTS source text;

-- Add storefront fields to teachers table
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS storefront_published boolean NOT NULL DEFAULT false;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS pricing_config jsonb DEFAULT '{}';
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS quote text;

-- Backfill Sam Ahn's slug
UPDATE teachers SET slug = 'sam-a', storefront_published = true
WHERE name = 'Sam Ahn' AND slug IS NULL;

-- Public RLS: anyone can read published teachers
CREATE POLICY IF NOT EXISTS "teachers_public_select" ON teachers
  FOR SELECT USING (storefront_published = true);

-- posts table: add teacher_id if not present
ALTER TABLE posts ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES teachers(id);

-- Backfill posts to Sam Ahn
UPDATE posts SET teacher_id = (SELECT id FROM teachers WHERE slug = 'sam-a' LIMIT 1)
WHERE teacher_id IS NULL;

-- ── Video session fields on sessions table ──────────────────────────────────
-- status: 'completed' default preserves all existing rows as completed sessions
alter table sessions add column if not exists status text not null default 'completed';
-- 'scheduled' | 'in_progress' | 'completed' | 'abandoned'

alter table sessions add column if not exists scheduled_at timestamptz;
alter table sessions add column if not exists daily_room_name text;
alter table sessions add column if not exists daily_room_url  text;
alter table sessions add column if not exists transcript      text;
alter table sessions add column if not exists transcript_quality text default 'full';
-- 'full' | 'partial' | 'none'

alter table sessions add column if not exists portrait_status text default 'pending';
-- 'pending' | 'generated' | 'failed'

alter table sessions add column if not exists flagged_moments jsonb default '[]'::jsonb;
alter table sessions add column if not exists parent_email_draft text;

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists sessions_daily_room_name
  on sessions (daily_room_name);

create index if not exists sessions_student_status
  on sessions (student_id, status);

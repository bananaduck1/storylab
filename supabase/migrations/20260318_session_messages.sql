-- session_messages: async pre/post-session thread between teacher and student
-- sender_role: 'teacher' | 'student'

create table if not exists session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  sender_role text not null check (sender_role in ('teacher', 'student')),
  body text not null,
  created_at timestamptz not null default now()
);

create index session_messages_session_id on session_messages(session_id, created_at);

-- RLS: students can read/write messages for their own session;
--      teachers can read/write all session messages.
alter table session_messages enable row level security;

-- Service-role key (used server-side) bypasses RLS entirely.
-- Public anon key is not used for these routes, so no anon policy needed.

-- reminder_sent_at: idempotency guard for the 24h reminder cron.
-- Once set, the cron won't re-send for this session.
alter table sessions add column if not exists reminder_sent_at timestamptz;

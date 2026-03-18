-- Stores individual speech chunks from both teacher and student browsers.
-- Each participant's Web Speech API posts chunks here in real-time as they speak.
-- On session complete, chunks are merged by timestamp into a full dialogue transcript.
-- Designed to be replaced by Deepgram WebSocket ingestion when scaling (see TODO-21).

create table if not exists transcript_chunks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  speaker text not null check (speaker in ('teacher', 'student')),
  text text not null,
  timestamp_ms bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists transcript_chunks_session
  on transcript_chunks (session_id, timestamp_ms asc);

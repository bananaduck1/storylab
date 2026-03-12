create table if not exists student_profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  full_name       text not null,
  grade           text not null,
  schools         text,
  essay_focus     text,
  writing_voice   text,
  goals           text,
  onboarding_done boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default 'New conversation',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists conversations_user_updated
  on conversations (user_id, updated_at desc);

create table if not exists conversation_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  file_name       text,
  file_type       text,
  created_at      timestamptz not null default now()
);

create index if not exists conv_messages_conv_created
  on conversation_messages (conversation_id, created_at asc);

create index if not exists conv_messages_user_date
  on conversation_messages (user_id, created_at);

create table if not exists usage_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  day             date not null default current_date,
  created_at      timestamptz not null default now()
);

create index if not exists usage_logs_user_day
  on usage_logs (user_id, day);

alter table student_profiles enable row level security;
alter table conversations enable row level security;
alter table conversation_messages enable row level security;
alter table usage_logs enable row level security;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger student_profiles_updated_at
  before update on student_profiles
  for each row execute procedure set_updated_at();

create trigger conversations_updated_at
  before update on conversations
  for each row execute procedure set_updated_at();

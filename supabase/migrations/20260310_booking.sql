-- ─── Availability slots ───────────────────────────────────────────────────────
create table if not exists availability (
  id          uuid primary key default gen_random_uuid(),
  offering_type text not null,                  -- e.g. 'consultation'
  datetime    timestamptz not null,
  is_booked   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ─── Bookings ─────────────────────────────────────────────────────────────────
create table if not exists bookings (
  id                uuid primary key default gen_random_uuid(),
  offering_type     text not null,
  availability_id   uuid references availability(id),
  parent_name       text not null,
  parent_email      text not null,
  student_grade     text not null,
  schools           text not null,
  essay_context     text not null,
  stripe_session_id text,
  status            text not null default 'pending', -- 'pending' | 'confirmed'
  created_at        timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table availability enable row level security;
alter table bookings enable row level security;

-- Public can read future, available slots (for the booking page)
create policy "Public read available slots"
  on availability for select
  using (is_booked = false and datetime > now());

-- Public can read a booking by id (for the confirmed page)
-- Service role key is used server-side so no extra policy needed for admin/webhook ops
create policy "Public read own booking"
  on bookings for select
  using (true);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists availability_offering_datetime
  on availability (offering_type, datetime)
  where is_booked = false;

create index if not exists bookings_stripe_session
  on bookings (stripe_session_id);

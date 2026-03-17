-- Add payment/quota columns to student_profiles
alter table student_profiles
  add column if not exists plan                  text        not null default 'free'
    check (plan in ('free', 'monthly')),
  add column if not exists monthly_message_limit int         not null default 50,
  add column if not exists extra_messages        int         not null default 0,
  add column if not exists stripe_customer_id    text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status   text,
  add column if not exists current_period_end    timestamptz;

create unique index if not exists student_profiles_stripe_customer
  on student_profiles (stripe_customer_id)
  where stripe_customer_id is not null;

-- Idempotency table for Stripe events (prevents double-processing)
create table if not exists stripe_events (
  id         text        primary key,
  created_at timestamptz not null default now()
);

-- Atomic decrement for extra_messages (floors at 0)
create or replace function decrement_extra_messages(p_user_id uuid)
returns void language plpgsql as $$
begin
  update student_profiles
  set extra_messages = extra_messages - 1
  where user_id = p_user_id
    and extra_messages > 0;
end;
$$;

-- Atomic increment for extra_messages (top-up credits)
create or replace function increment_extra_messages(p_user_id uuid, p_amount int)
returns void language plpgsql as $$
begin
  update student_profiles
  set extra_messages = extra_messages + p_amount
  where user_id = p_user_id;
end;
$$;

-- ============================================================
-- Kumbhak Pro — entitlements schema (run in Supabase SQL editor)
-- ============================================================
-- One row per user. 'plan' is the source of truth for Pro access.
-- Only the server (service-role key) writes here; clients can read
-- their own row via RLS. This is what makes the lifetime unlock
-- impossible to forge from the browser.

create table if not exists public.entitlements (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  email               text,
  plan                text not null default 'free',   -- 'free' | 'pro'
  source              text default 'web',              -- 'web' | 'ios' | 'android' (where they paid)
  razorpay_order_id   text,
  razorpay_payment_id text,
  amount              integer,                         -- in paise
  currency            text default 'INR',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table public.entitlements enable row level security;

-- A signed-in user may read ONLY their own entitlement.
drop policy if exists "read own entitlement" on public.entitlements;
create policy "read own entitlement"
  on public.entitlements for select
  using (auth.uid() = user_id);

-- NOTE: intentionally NO insert/update policy for clients.
-- /api/verify-payment uses the service-role key (which bypasses RLS)
-- to grant Pro only after Razorpay signature verification.

-- Auto-create a free entitlement row when a user signs up.
-- NOTE: function + trigger are namespaced (kumbhak_*) so this is SAFE to run on a
-- DB shared with another app — it will NOT clobber an existing handle_new_user /
-- on_auth_user_created from another project. Postgres allows multiple triggers on
-- auth.users, so kumbhak's runs alongside any others.
create or replace function public.kumbhak_handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.entitlements (user_id, email, plan)
  values (new.id, new.email, 'free')
  on conflict (user_id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created_kumbhak on auth.users;
create trigger on_auth_user_created_kumbhak
  after insert on auth.users
  for each row execute function public.kumbhak_handle_new_user();

-- Daily AI-coach usage counter (fair-use cap for /api/ai-session). Written by
-- the service role only; users may read their own row.
create table if not exists public.ai_usage (
  user_id    uuid references auth.users(id) on delete cascade,
  day        date not null default current_date,
  count      integer not null default 0,
  updated_at timestamptz default now(),
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
drop policy if exists "read own ai usage" on public.ai_usage;
create policy "read own ai usage"
  on public.ai_usage for select
  using (auth.uid() = user_id);

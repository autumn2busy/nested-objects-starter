-- FIX SCRIPT: Profiles Schema & Indexes
-- Corresponds to AUD-DB-001 and AUD-DB-004

-- 1. Ensure profiles table exists with correct structure
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  outseta_person_uid text unique,
  outseta_account_id text,
  email text,
  user_email text, -- Redundant but often used for easy querying
  first_name text,
  last_name text,
  full_name text,
  display_name text,
  phone text,
  subscription_tier text default 'free',
  subscription_status text default 'active',
  subscription_start_date timestamptz,
  subscription_end_date timestamptz,
  plan_uid text,
  plan_name text,
  billing_renewal_term integer,
  outseta_created_at timestamptz,
  outseta_updated_at timestamptz,
  outseta_data jsonb,
  last_login_at timestamptz,
  last_active_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Add Critical Indexes
create index if not exists idx_profiles_email on public.profiles(user_email);
create index if not exists idx_profiles_outseta_uid on public.profiles(outseta_person_uid);
create index if not exists idx_profiles_subscription_tier on public.profiles(subscription_tier);

-- 3. Enable RLS
alter table public.profiles enable row level security;

-- 4. Policies
-- Users can read their own profile
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile (some fields)
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Service Role (webhooks) handles inserts/updates usually, but we need to ensure it has bypass (default in Supabase)

-- 5. Trigger for updated_at
create or replace function update_profiles_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists update_profiles_updated_at_trigger on public.profiles;
create trigger update_profiles_updated_at_trigger
before update on public.profiles
for each row execute function update_profiles_updated_at();

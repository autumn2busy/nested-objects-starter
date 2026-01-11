-- Enable UUID extension (usually enabled by default in Supabase)
create extension if not exists "uuid-ossp";

-- Enable Trigram extension for text search indexes (required for gin_trgm_ops)
create extension if not exists "pg_trgm";

-- 1. Training Progress Table
create table if not exists public.training_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  module_id text not null,
  status text check (status in ('started', 'completed')) default 'started',
  quiz_score integer check (quiz_score >= 0 and quiz_score <= 100),
  completed_at timestamptz,
  updated_at timestamptz default now(),
  
  -- Unique constraint to prevent duplicate rows per module per user
  unique(user_id, module_id)
);

-- 2. Profiles Table (Synced from Outseta)
create table if not exists public.profiles (
  id uuid default uuid_generate_v4() primary key,
  outseta_account_id text unique not null,
  email text unique not null,
  first_name text,
  last_name text,
  phone text,
  subscription_tier text,
  subscription_status text,
  subscription_start_date timestamptz,
  subscription_end_date timestamptz,
  outseta_data jsonb, -- Store raw webhook payload for debugging
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Row Level Security (RLS)
alter table public.training_progress enable row level security;
alter table public.profiles enable row level security;

-- Policy: Users can view their own training progress
-- Casting to text ensures compatibility if user_id was previously created as text
create policy "Users can view own training progress"
  on public.training_progress for select
  using (auth.uid()::text = user_id::text);

-- Policy: Users can insert/update their own progress
create policy "Users can update own training progress"
  on public.training_progress for insert
  with check (auth.uid()::text = user_id::text);

create policy "Users can modify own training progress"
  on public.training_progress for update
  using (auth.uid()::text = user_id::text);

-- Policy: Users can view their own profile (match by email)
-- Note: This assumes Supabase Auth email matches Outseta email. 
-- Ideally we'd link by user_id if we synced Auth users too.
create policy "Users can view own profile by email"
  on public.profiles for select
  using (email = (auth.jwt() ->> 'email'));

-- 4. RPC: Upsert Profile (called by Webhook)
-- Drop first to avoid "cannot change return type" or "cannot remove parameter defaults" errors
drop function if exists upsert_profile(text, text, text, text, text, text, jsonb);

create or replace function upsert_profile(
  p_outseta_account_id text,
  p_email text,
  p_first_name text,
  p_last_name text,
  p_subscription_tier text,
  p_subscription_status text,
  p_outseta_data jsonb
)
returns uuid
language plpgsql
security definer -- Runs with elevated privileges to bypass RLS for webhook
as $$
declare
  v_profile_id uuid;
begin
  insert into public.profiles (
    outseta_account_id,
    email,
    first_name,
    last_name,
    subscription_tier,
    subscription_status,
    outseta_data,
    updated_at
  )
  values (
    p_outseta_account_id,
    p_email,
    p_first_name,
    p_last_name,
    p_subscription_tier,
    p_subscription_status,
    p_outseta_data,
    now()
  )
  on conflict (outseta_account_id) do update
  set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    subscription_tier = excluded.subscription_tier,
    subscription_status = excluded.subscription_status,
    outseta_data = excluded.outseta_data,
    updated_at = now()
  returning id into v_profile_id;

  return v_profile_id;
end;
$$;

-- 5. Trigger to update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists update_training_progress_updated_at on public.training_progress;
create trigger update_training_progress_updated_at
before update on public.training_progress
for each row execute function update_updated_at_column();

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
before update on public.profiles
for each row execute function update_updated_at_column();

-- 6. Firms Table (Directory)
create table if not exists public.firms (
  id uuid default uuid_generate_v4() primary key,
  slug text unique,
  name text not null,
  url text,
  vendor_page_url text,
  logo_url text,
  geographic_coverage text,
  categories jsonb,
  pay_min numeric,
  pay_max numeric,
  pay_type text,
  company_size text,
  industry_focus text,
  rating numeric,
  phone text,
  email text,
  address text,
  latitude float8,
  longitude float8,
  description text,
  is_published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Firms RLS
alter table public.firms enable row level security;

-- Public read access for published firms
create policy "Public can view published firms"
  on public.firms for select
  using (is_published = true);

-- Service role full access (for import scripts)
-- Note: Service role bypasses RLS by default, but keeping this explicit is fine or we can omit it.

-- Indexes for search performance
create index if not exists firms_name_idx on public.firms using gin (name gin_trgm_ops);
create index if not exists firms_geo_idx on public.firms (geographic_coverage);
create index if not exists firms_published_idx on public.firms (is_published);

-- Trigger for updated_at
drop trigger if exists update_firms_updated_at on public.firms;
create trigger update_firms_updated_at
before update on public.firms
for each row execute function update_updated_at_column();


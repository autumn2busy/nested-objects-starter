
-- =============================
-- Nested Objects - Supabase Schema
-- =============================

-- Enable required extensions
create extension if not exists vector;
create extension if not exists pgcrypto;

-- Public tables
create table if not exists public.users (
  id uuid primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_email text not null unique,
  display_name text,
  headline text,
  city text,
  state text,
  primary_interest text,
  tools text,
  notes text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  niche text, -- e.g., property inspection, notary, auto, occupancy
  website text,
  phone text,
  email text,
  location text,
  pay_range text,
  requirements text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.firm_contacts (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  name text,
  role text,
  email text,
  phone text,
  linkedin text,
  created_at timestamptz default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  firm_id uuid,
  title text,
  firm_name text,
  region text,
  address text,
  appointment_date date,
  appointment_time text,
  status text not null default 'scheduled',
  payout numeric(10,2),
  payout_status text default 'unpaid',
  mileage numeric(10,2),
  sla_target_hours integer,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint fk_jobs_firm foreign key (firm_id) references public.firms(id) on delete set null
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null, -- guide | checklist | video | template
  description text,
  url text,
  access_level text not null default 'pro', -- free | pro | elite | agency
  created_at timestamptz default now()
);

create table if not exists public.user_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event text not null,
  metadata jsonb,
  occurred_at timestamptz default now()
);

-- Embeddings for semantic search (choose dimension to match your model)
create table if not exists public.embeddings (
  id uuid primary key default gen_random_uuid(),
  content_type text not null, -- firm | job | resource
  ref_id uuid not null,
  embedding vector(1536) not null, -- adjust to model output size
  created_at timestamptz default now()
);

-- Entitlement overrides (for promos, trials, partners)
create table if not exists public.entitlement_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  feature_key text not null, -- e.g., directory_access, ai_resume, job_intel
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Helpful indexes
create index if not exists idx_firms_name on public.firms using gin (to_tsvector('english', name));
create index if not exists idx_jobs_title on public.jobs using gin (to_tsvector('english', title));
create index if not exists idx_embeddings_ref on public.embeddings (content_type, ref_id);

-- Timestamps trigger for updated_at on firms
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_firms_updated_at on public.firms;
create trigger trg_firms_updated_at
before update on public.firms
for each row execute procedure public.set_updated_at();

-- Timestamps trigger for updated_at on profiles
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

-- Timestamps trigger for updated_at on jobs
drop trigger if exists trg_jobs_updated_at on public.jobs;
create trigger trg_jobs_updated_at
before update on public.jobs
for each row execute procedure public.set_updated_at();

-- Row level security for jobs
alter table public.jobs enable row level security;

drop policy if exists "jobs_own_select" on public.jobs;
create policy "jobs_own_select"
  on public.jobs for select
  to authenticated
  using ( user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub' );

drop policy if exists "jobs_own_modify" on public.jobs;
drop policy if exists "jobs_own_insert" on public.jobs;
create policy "jobs_own_insert"
  on public.jobs for insert
  to authenticated
  with check ( user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub' );

drop policy if exists "jobs_own_update" on public.jobs;
create policy "jobs_own_update"
  on public.jobs for update
  to authenticated
  using ( user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub' )
  with check ( user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub' );

drop policy if exists "jobs_own_delete" on public.jobs;
create policy "jobs_own_delete"
  on public.jobs for delete
  to authenticated
  using ( user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub' );

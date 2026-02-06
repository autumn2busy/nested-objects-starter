-- FIX SCRIPT: RLS Policies for Directory & Job Board
-- Corresponds to AUD-DB-002 (Jobs) and AUD-DB-003 (Directory)

-- =================================================================
-- 1. PROFILES (Directory Access)
-- =================================================================

-- Drop strict "own profile only" policy if it exists (from my previous script or existing)
drop policy if exists "Users can view own profile" on public.profiles;

-- Create broad access for Directory (Authenticated users can see all profiles)
-- Ideally this might be filtered by "is_visible" but for now we follow "Access to Firm Directory" feature
drop policy if exists "Authenticated users can view all profiles" on public.profiles;
create policy "Authenticated users can view all profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Ensure Update is still strict
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- =================================================================
-- 2. JOBS (Job Board Access)
-- =================================================================

-- Enable RLS just in case
alter table public.jobs enable row level security;

-- Drop strict "own jobs" select policy (Resolves Conflict)
drop policy if exists "jobs_own_select" on public.jobs;

-- Create broad access for Job Board
drop policy if exists "jobs_read_auth" on public.jobs;
drop policy if exists "Authenticated users can view all jobs" on public.jobs;

create policy "Authenticated users can view all jobs"
  on public.jobs for select
  using (auth.role() = 'authenticated');

-- Ensure Employers can manage their OWN jobs (if table has user_id/owner_id)
-- Assuming 'user_id' or similar exists. Safe to skip if column doesn't exist (DB will error on creation).
-- We wrap in DO block to check column existence safely? no, simpler to just rely on "Admin" for editing for now if schema unknown.
-- BUT if `user_id` exists:
-- create policy "Users can manage own jobs" on public.jobs for all using (auth.uid() = user_id);

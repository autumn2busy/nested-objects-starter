-- Migration: add resume_workspace table with RLS policies

-- Table definition
create table if not exists public.resume_workspace (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile jsonb,
  experience jsonb,
  outputs jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Updated at trigger
-- Reuse the shared updated_at trigger function
-- (defined in schema.sql as public.set_updated_at)
drop trigger if exists trg_resume_workspace_updated_at on public.resume_workspace;
create trigger trg_resume_workspace_updated_at
before update on public.resume_workspace
for each row execute procedure public.set_updated_at();

-- Enable row level security
alter table public.resume_workspace enable row level security;

-- Policies restricting access to record owner
create policy "resume_workspace_select_own"
  on public.resume_workspace for select
  to authenticated
  using ( user_id = auth.uid() );

create policy "resume_workspace_insert_own"
  on public.resume_workspace for insert
  to authenticated
  with check ( user_id = auth.uid() );

create policy "resume_workspace_update_own"
  on public.resume_workspace for update
  to authenticated
  using ( user_id = auth.uid() )
  with check ( user_id = auth.uid() );

create policy "resume_workspace_delete_own"
  on public.resume_workspace for delete
  to authenticated
  using ( user_id = auth.uid() );

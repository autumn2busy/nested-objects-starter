-- Add jobs table for inspector job tracker

drop table if exists public.jobs cascade;

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

-- Maintain updated_at automatically when helper exists
alter table public.jobs drop constraint if exists jobs_updated_at_trigger;

-- Recreate trigger if function is present
create or replace function public.ensure_jobs_updated_at()
returns void as $$
begin
  if exists (
    select 1 from pg_proc
    where proname = 'set_updated_at'
      and pronamespace = 'public'::regnamespace
  ) then
    drop trigger if exists trg_jobs_updated_at on public.jobs;
    create trigger trg_jobs_updated_at
    before update on public.jobs
    for each row execute procedure public.set_updated_at();
  end if;
end;
$$ language plpgsql;

select public.ensure_jobs_updated_at();

drop function public.ensure_jobs_updated_at();

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

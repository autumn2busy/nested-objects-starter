begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  profile_id uuid,
  name text not null,
  email text not null,
  topic text not null,
  message text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- The same transaction upgrades the historical table or creates a fresh one.
-- Refuse incompatible existing data rather than inventing dates, truncating
-- messages, deleting records, or printing contact values in an error.
lock table public.contact_submissions in access exclusive mode;
do $$
begin
  if exists (
    select 1 from public.contact_submissions
    where created_at is null or updated_at is null
      or name is null or char_length(name) not between 1 and 120
      or email is null or char_length(email) not between 3 and 254
      or topic is null or char_length(topic) not between 1 and 120
      or message is null or char_length(message) not between 1 and 5000
  ) then
    raise exception 'Contact receipt migration refused: existing rows need private compatibility review.';
  end if;
end;
$$;

alter table public.contact_submissions
  alter column name set not null,
  alter column email set not null,
  alter column topic set not null,
  alter column message set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null,
  drop constraint if exists contact_submissions_user_id_fkey,
  drop constraint if exists contact_submissions_profile_id_fkey,
  drop constraint if exists contact_submissions_name_length,
  drop constraint if exists contact_submissions_email_length,
  drop constraint if exists contact_submissions_topic_length,
  drop constraint if exists contact_submissions_message_length,
  add constraint contact_submissions_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null,
  add constraint contact_submissions_profile_id_fkey
    foreign key (profile_id) references public.profiles(id) on delete set null,
  add constraint contact_submissions_name_length check (char_length(name) between 1 and 120),
  add constraint contact_submissions_email_length check (char_length(email) between 3 and 254),
  add constraint contact_submissions_topic_length check (char_length(topic) between 1 and 120),
  add constraint contact_submissions_message_length check (char_length(message) between 1 and 5000);

alter table public.contact_submissions enable row level security;
revoke all on table public.contact_submissions from public, anon, authenticated;
grant select, insert, update, delete on table public.contact_submissions to service_role;

-- Remove both known historical policies, including the exact old SELECT name.
drop policy if exists "Users can view their own contact submissions" on public.contact_submissions;
drop policy if exists "Users can view their own submissions" on public.contact_submissions;
drop policy if exists "Service role can manage contact submissions" on public.contact_submissions;
drop policy if exists contact_submissions_service_role_all on public.contact_submissions;

-- Do not silently override a policy installed by an unrelated migration.
do $$
begin
  if exists (
    select 1 from pg_catalog.pg_policy
    where polrelid = 'public.contact_submissions'::regclass
  ) then
    raise exception 'Contact receipt migration refused: unexpected policies need private review.';
  end if;
end;
$$;

create policy contact_submissions_service_role_all
  on public.contact_submissions
  for all
  to service_role
  using (true)
  with check (true);

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);
create index if not exists contact_submissions_profile_id_idx
  on public.contact_submissions (profile_id)
  where profile_id is not null;

-- Keep the shared historical function intact for any other tables using it.
create or replace function public.set_contact_submissions_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_contact_submissions_updated_at() from public, anon, authenticated;
grant execute on function public.set_contact_submissions_updated_at() to service_role;

drop trigger if exists on_contact_submissions_updated on public.contact_submissions;
drop trigger if exists set_contact_submissions_updated_at on public.contact_submissions;
create trigger set_contact_submissions_updated_at
  before update on public.contact_submissions
  for each row
  execute function public.set_contact_submissions_updated_at();

comment on table public.contact_submissions is
  'Server-only contact receipt ledger. No direct anon or authenticated access.';

commit;

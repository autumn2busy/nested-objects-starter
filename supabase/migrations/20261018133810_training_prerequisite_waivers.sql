-- Separate prerequisite exceptions from genuine lesson and quiz completion.
-- No member identifiers or live grants are seeded by this migration.
create table public.training_prerequisite_waivers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  outseta_person_uid text not null check (length(outseta_person_uid) between 1 and 160),
  outseta_account_uid text not null check (length(outseta_account_uid) between 1 and 160),
  module_id uuid not null references public.training_modules(id) on delete restrict,
  prerequisite_module_id uuid not null references public.training_modules(id) on delete restrict,
  reason text not null check (length(trim(reason)) between 1 and 1000),
  approval_reference text not null check (length(trim(approval_reference)) between 1 and 300),
  approved_at timestamptz not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  check (module_id <> prerequisite_module_id),
  check (expires_at is null or expires_at > approved_at)
);
create unique index training_prerequisite_waivers_member_module_idx
  on public.training_prerequisite_waivers(profile_id, module_id) where revoked_at is null;
alter table public.training_prerequisite_waivers enable row level security;
alter table public.training_prerequisite_waivers force row level security;
-- Clear inherited default grants before granting the narrow server capabilities.
revoke all on public.training_prerequisite_waivers from public, anon, authenticated, service_role;
grant select, insert on public.training_prerequisite_waivers to service_role;
grant update (revoked_at) on public.training_prerequisite_waivers to service_role;

-- A revoked approval remains historical; a fresh approval requires a new row.
create function public.enforce_training_waiver_revocation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at then
    raise exception 'A training waiver revocation cannot be cleared or rewritten'
      using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_training_waiver_revocation()
  from public, anon, authenticated, service_role;
create trigger training_prerequisite_waivers_revocation_guard
  before update of revoked_at on public.training_prerequisite_waivers
  for each row execute function public.enforce_training_waiver_revocation();

comment on table public.training_prerequisite_waivers is
  'Audited member-specific prerequisite exception; never grants plan entitlement or changes quiz/lesson completion. Server only; revoke instead of delete.';

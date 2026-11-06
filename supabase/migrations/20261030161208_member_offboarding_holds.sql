-- Server-only holds retain separate cancellation/release cycles. Store stable
-- identity and approval references, never names, emails or payment details.
-- No profile foreign key, provider mutation or email operation belongs here.
create table public.member_offboarding_holds (
  account_uid text not null check (account_uid ~ '^[A-Za-z0-9_-]{1,128}$'),
  person_uid text not null check (person_uid ~ '^[A-Za-z0-9_-]{1,128}$'),
  source_event_uid text not null check (source_event_uid ~ '^[A-Za-z0-9_-]{1,128}$'),
  source_event_at timestamptz not null,
  reason text not null check (reason in ('cancellation', 'owner_removal', 'acceptance_test')),
  blocked_at timestamptz not null default now(),
  released_at timestamptz,
  release_approval_ref text,
  primary key (account_uid, source_event_uid),
  check (released_at is null or released_at >= blocked_at),
  check (
    (released_at is null and release_approval_ref is null)
    or (released_at is not null and release_approval_ref is not null
      and length(btrim(release_approval_ref)) between 1 and 200)
  )
);

create unique index member_offboarding_holds_account_active_idx
  on public.member_offboarding_holds (account_uid) where released_at is null;
create index member_offboarding_holds_person_active_idx
  on public.member_offboarding_holds (person_uid) where released_at is null;

alter table public.member_offboarding_holds enable row level security;
-- Revoke legacy default grants before granting the exact server operations.
revoke all on table public.member_offboarding_holds from public, anon, authenticated, service_role;
grant select on table public.member_offboarding_holds to service_role;
grant insert (account_uid, person_uid, source_event_uid, source_event_at, reason)
  on public.member_offboarding_holds to service_role;
grant update (released_at, release_approval_ref)
  on public.member_offboarding_holds to service_role;

create function public.guard_member_offboarding_hold_update()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.released_at is not null
    or row(new.account_uid, new.person_uid, new.source_event_uid,
      new.source_event_at, new.reason, new.blocked_at)
      is distinct from row(old.account_uid, old.person_uid, old.source_event_uid,
        old.source_event_at, old.reason, old.blocked_at)
    or new.released_at is null or new.release_approval_ref is null then
    raise exception 'Offboarding history is immutable; only an approved initial release is allowed'
      using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_member_offboarding_hold_update()
  from public, anon, authenticated, service_role;
create trigger member_offboarding_holds_immutable_history
  before update on public.member_offboarding_holds
  for each row execute function public.guard_member_offboarding_hold_update();

comment on table public.member_offboarding_holds is
  'CANCEL-002: verified access holds survive profile removal. Approved release is one-way; a later cancellation creates a new retained row.';

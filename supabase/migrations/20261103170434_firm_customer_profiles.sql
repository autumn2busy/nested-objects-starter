-- FIRM-005: customer tenants are separate from the public inspector firm directory.
-- Reviewed local scaffold only. Applying this migration is a separate consequential action.
create table public.firm_customer_accounts (
  id uuid primary key default gen_random_uuid(),
  outseta_account_uid text not null unique check (outseta_account_uid ~ '^[A-Za-z0-9]{4,40}$'),
  lifecycle_state text not null default 'active' check (lifecycle_state in ('active','suspended')),
  pilot_stage text not null default 'profile_pending' check (pilot_stage in ('profile_pending','scope_review','pilot_ready','pilot_active','pilot_closed')),
  profile jsonb,
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((profile is null and revision = 0) or (jsonb_typeof(profile) = 'object' and revision > 0))
);
create table public.firm_customer_memberships (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firm_customer_accounts(id),
  outseta_person_uid text not null check (outseta_person_uid ~ '^[A-Za-z0-9]{4,40}$'),
  member_role text not null check (member_role in ('owner','staff')),
  membership_state text not null default 'active' check (membership_state in ('active','revoked')),
  created_at timestamptz not null default now(),
  unique (firm_id,outseta_person_uid)
);
create index firm_customer_memberships_person on public.firm_customer_memberships(outseta_person_uid,firm_id);
create table public.firm_customer_profile_events (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firm_customer_accounts(id),
  actor_person_uid text not null,
  revision integer not null,
  event_type text not null check (event_type = 'profile_saved'),
  created_at timestamptz not null default now(),
  unique(firm_id,revision)
);
create index firm_customer_profile_events_firm on public.firm_customer_profile_events(firm_id,created_at);
alter table public.firm_customer_accounts enable row level security;
alter table public.firm_customer_accounts force row level security;
alter table public.firm_customer_memberships enable row level security;
alter table public.firm_customer_memberships force row level security;
alter table public.firm_customer_profile_events enable row level security;
alter table public.firm_customer_profile_events force row level security;
-- No browser policies. Default Supabase grants must not expose private tenant data.
revoke all on public.firm_customer_accounts,public.firm_customer_memberships,public.firm_customer_profile_events from public,anon,authenticated,service_role;
comment on table public.firm_customer_accounts is 'Private operational firm customer tenants; not the public hiring-firm directory. Outseta is access authority; this table is not payment evidence.';

create function public.read_firm_customer_profile(p_account_uid text,p_person_uid text,p_is_primary boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.firm_customer_accounts%rowtype; m public.firm_customer_memberships%rowtype;
begin
  select * into a from public.firm_customer_accounts where outseta_account_uid=p_account_uid;
  if not found then
    if p_is_primary is true then return jsonb_build_object('profile',null,'canEdit',true); end if;
    raise exception 'Firm access denied' using errcode='42501';
  end if;
  if a.lifecycle_state <> 'active' then raise exception 'Firm access denied' using errcode='42501'; end if;
  select * into m from public.firm_customer_memberships where firm_id=a.id and outseta_person_uid=p_person_uid;
  if not found or m.membership_state <> 'active' then raise exception 'Firm access denied' using errcode='42501'; end if;
  return jsonb_build_object('profile',case when a.profile is null then null else a.profile || jsonb_build_object('id',a.id,'revision',a.revision,'pilotStage',a.pilot_stage,'updatedAt',a.updated_at) end,
    'canEdit',p_is_primary is true and m.member_role='owner');
end $$;

create function public.save_firm_customer_profile(p_account_uid text,p_person_uid text,p_is_primary boolean,p_expected_revision integer,p_profile jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.firm_customer_accounts%rowtype; m public.firm_customer_memberships%rowtype; field_name text;
begin
  if p_is_primary is distinct from true or p_account_uid !~ '^[A-Za-z0-9]{4,40}$' or p_person_uid !~ '^[A-Za-z0-9]{4,40}$' then raise exception 'Firm access denied' using errcode='42501'; end if;
  if p_expected_revision is null or p_expected_revision < 0 or p_profile is null or jsonb_typeof(p_profile) <> 'object' then raise exception 'Invalid profile' using errcode='22023'; end if;
  if not (p_profile ?& array['legalName','displayName','website','address','primaryContactName','primaryContactEmail','serviceZips','inspectionTypes','requirements']) or
     (select count(*) from jsonb_object_keys(p_profile)) <> 9 then raise exception 'Invalid profile fields' using errcode='22023'; end if;
  foreach field_name in array array['legalName','displayName','website','address','primaryContactName','primaryContactEmail','requirements'] loop
    if jsonb_typeof(p_profile->field_name) <> 'string' then raise exception 'Invalid profile text' using errcode='22023'; end if;
  end loop;
  if length(btrim(p_profile->>'legalName')) not between 1 and 200 or length(btrim(p_profile->>'displayName')) not between 1 and 200
    or length(btrim(p_profile->>'primaryContactName')) not between 1 and 200
    or length(p_profile->>'primaryContactEmail') > 254 or p_profile->>'primaryContactEmail' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or length(p_profile->>'website') > 500 or (p_profile->>'website' <> '' and p_profile->>'website' !~ '^https://[^/@[:space:]]+')
    or length(p_profile->>'address') > 1000 or length(p_profile->>'requirements') > 5000
    or jsonb_typeof(p_profile->'serviceZips') <> 'array' or jsonb_typeof(p_profile->'inspectionTypes') <> 'array'
    then raise exception 'Invalid profile values' using errcode='22023'; end if;
  if jsonb_array_length(p_profile->'serviceZips') > 500 or jsonb_array_length(p_profile->'inspectionTypes') > 30
    or exists(select 1 from jsonb_array_elements(p_profile->'serviceZips') v where jsonb_typeof(v) <> 'string' or v #>> '{}' !~ '^[0-9]{5}$')
    or exists(select 1 from jsonb_array_elements(p_profile->'inspectionTypes') v where jsonb_typeof(v) <> 'string' or length(btrim(v #>> '{}')) not between 1 and 80)
    then raise exception 'Invalid profile coverage' using errcode='22023'; end if;
  -- Unique account binding serializes concurrent initial saves without reactivating revoked memberships.
  insert into public.firm_customer_accounts(outseta_account_uid) values(p_account_uid) on conflict(outseta_account_uid) do nothing;
  select * into a from public.firm_customer_accounts where outseta_account_uid=p_account_uid for update;
  if a.lifecycle_state <> 'active' then raise exception 'Firm access denied' using errcode='42501'; end if;
  select * into m from public.firm_customer_memberships where firm_id=a.id and outseta_person_uid=p_person_uid;
  if not found then
    -- A second/new primary is not automatically added to an already initialized tenant.
    if a.revision <> 0 then raise exception 'Firm membership review required' using errcode='42501'; end if;
    insert into public.firm_customer_memberships(firm_id,outseta_person_uid,member_role) values(a.id,p_person_uid,'owner') returning * into m;
  end if;
  if m.membership_state <> 'active' or m.member_role <> 'owner' then raise exception 'Firm access denied' using errcode='42501'; end if;
  if a.revision <> p_expected_revision then raise exception 'Profile changed; reload before saving' using errcode='40001'; end if;
  if a.profile is not distinct from p_profile then
    return public.read_firm_customer_profile(p_account_uid,p_person_uid,p_is_primary);
  end if;
  update public.firm_customer_accounts set profile=p_profile,revision=revision+1,updated_at=now() where id=a.id returning * into a;
  insert into public.firm_customer_profile_events(firm_id,actor_person_uid,revision,event_type) values(a.id,p_person_uid,a.revision,'profile_saved');
  return public.read_firm_customer_profile(p_account_uid,p_person_uid,p_is_primary);
end $$;
revoke all on function public.read_firm_customer_profile(text,text,boolean) from public,anon,authenticated,service_role;
revoke all on function public.save_firm_customer_profile(text,text,boolean,integer,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.read_firm_customer_profile(text,text,boolean) to service_role;
grant execute on function public.save_firm_customer_profile(text,text,boolean,integer,jsonb) to service_role;

begin;

-- One durable intent before each identity POST. A transport failure is reconciled
-- by GET; an existing intent never authorizes a blind repeat of a missing POST.
create table public.ac_nonrecurring_identity_intents (
  connection_id text not null check (connection_id ~ '^[1-9][0-9]*$'),
  person_uid text not null check (person_uid ~ '^[A-Za-z0-9]{4,40}$'),
  account_uid text not null check (account_uid ~ '^[A-Za-z0-9]{4,40}$'),
  kind text not null check (kind in ('contact','customer')),
  created_at timestamptz not null default now(),
  primary key (connection_id, person_uid, kind)
);
alter table public.ac_nonrecurring_identity_intents enable row level security;
revoke all on public.ac_nonrecurring_identity_intents from public, anon, authenticated;
grant select, insert on public.ac_nonrecurring_identity_intents to service_role;

-- AC-009: one immutable invoice/payment identity, no email, body, or credentials.
create table public.ac_pass_payment_sync_receipts (
  connection_id text not null check (connection_id ~ '^[1-9][0-9]*$'),
  invoice_uid text not null check (invoice_uid ~ '^[A-Za-z0-9_-]{1,160}$'),
  identity jsonb not null check (jsonb_typeof(identity) = 'object'),
  captured_minor bigint not null check (captured_minor > 0 and captured_minor <= 9007199254740991),
  refunded_minor bigint not null default 0 check (refunded_minor >= 0 and refunded_minor <= captured_minor),
  observed_refunded_minor bigint not null default 0 check (observed_refunded_minor >= refunded_minor and observed_refunded_minor <= captured_minor),
  write_started boolean not null default false,
  ac_order_id text check (ac_order_id ~ '^[1-9][0-9]*$'),
  state text not null default 'claimed' check (state in ('claimed','verified','blocked','uncertain')),
  code text not null default 'claimed' check (code ~ '^[a-z0-9_]{1,100}$'),
  claim_token uuid,
  lease_until timestamptz,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz,
  primary key (connection_id, invoice_uid),
  unique (claim_token),
  check (ac_order_id is null or write_started)
);
alter table public.ac_pass_payment_sync_receipts enable row level security;
revoke all on public.ac_pass_payment_sync_receipts from public, anon, authenticated;
grant select, insert, update on public.ac_pass_payment_sync_receipts to service_role;

create function public.claim_ac_pass_order_sync(p_connection_id text, p_invoice_uid text, p_identity jsonb, p_refunded_minor bigint)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  r public.ac_pass_payment_sync_receipts%rowtype;
  token uuid := gen_random_uuid();
  captured bigint;
begin
  if p_identity is null or jsonb_typeof(p_identity) <> 'object' or
    (select count(*) from jsonb_object_keys(p_identity)) <> 12 or
    (p_identity - array['accountUid','acContactId','acCustomerId','capturedMinor','currency','externalId','paidAt','personUid','planUid','stripeAccountId','stripeChargeId','subscriptionUid']::text[]) <> '{}'::jsonb or
    p_identity->>'currency' is distinct from 'USD' or
    p_identity->>'externalId' is distinct from 'outseta-pass-invoice-' || p_invoice_uid or
    coalesce(p_identity->>'stripeAccountId','') !~ '^acct_[A-Za-z0-9]+$' or
    coalesce(p_identity->>'stripeChargeId','') !~ '^ch_[A-Za-z0-9]+$' or
    coalesce(p_identity->>'acContactId','') !~ '^[1-9][0-9]*$' or
    coalesce(p_identity->>'acCustomerId','') !~ '^[1-9][0-9]*$' or
    coalesce(p_identity->>'capturedMinor','') !~ '^[1-9][0-9]*$' or
    exists (select 1 from jsonb_each(p_identity) as e where e.value = 'null'::jsonb) then
    raise exception 'invalid_payment_identity';
  end if;
  captured := (p_identity->>'capturedMinor')::bigint;
  if p_refunded_minor is null or p_refunded_minor < 0 or p_refunded_minor > captured then raise exception 'invalid_refund'; end if;
  insert into public.ac_pass_payment_sync_receipts(connection_id,invoice_uid,identity,captured_minor)
    values(p_connection_id,p_invoice_uid,p_identity,captured) on conflict do nothing;
  select * into strict r from public.ac_pass_payment_sync_receipts
    where connection_id=p_connection_id and invoice_uid=p_invoice_uid for update;
  if r.identity <> p_identity then raise exception 'payment_identity_conflict'; end if;
  if p_refunded_minor < r.observed_refunded_minor then raise exception 'stale_payment_evidence'; end if;
  if r.lease_until > now() then return null; end if;
  update public.ac_pass_payment_sync_receipts set claim_token=token,lease_until=now()+interval '5 minutes',
    state='claimed',attempts=attempts+1,updated_at=now(),observed_refunded_minor=p_refunded_minor
    where connection_id=p_connection_id and invoice_uid=p_invoice_uid;
  return jsonb_build_object('token',token,'writeStarted',r.write_started,'orderId',r.ac_order_id,
    'capturedMinor',r.captured_minor,'refundedMinor',r.refunded_minor);
end;
$$;

create function public.mark_ac_pass_order_write(p_token uuid)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  update public.ac_pass_payment_sync_receipts set write_started=true,updated_at=now()
    where claim_token=p_token and lease_until>now();
  if not found then raise exception 'claim_expired'; end if;
  return true;
end;
$$;

create function public.finish_ac_pass_order_sync(p_token uuid,p_state text,p_code text,p_order_id text default null,p_refunded_minor bigint default null)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare r public.ac_pass_payment_sync_receipts%rowtype;
begin
  select * into strict r from public.ac_pass_payment_sync_receipts where claim_token=p_token and lease_until>now() for update;
  if p_state is null or p_state not in ('verified','blocked','uncertain') or coalesce(p_code,'') !~ '^[a-z0-9_]{1,100}$' then raise exception 'invalid_receipt_result'; end if;
  if p_order_id is not null and (p_order_id !~ '^[1-9][0-9]*$' or (r.ac_order_id is not null and r.ac_order_id<>p_order_id)) then raise exception 'order_identity_conflict'; end if;
  if p_state='verified' and (not r.write_started or p_order_id is null or p_refunded_minor is null or
    p_refunded_minor<r.refunded_minor or p_refunded_minor<>r.observed_refunded_minor) then raise exception 'unverified_receipt'; end if;
  update public.ac_pass_payment_sync_receipts set state=p_state,code=p_code,claim_token=null,lease_until=null,updated_at=now(),
    ac_order_id=coalesce(p_order_id,ac_order_id),
    refunded_minor=case when p_state='verified' then p_refunded_minor else refunded_minor end,
    verified_at=case when p_state='verified' then now() else verified_at end
    where connection_id=r.connection_id and invoice_uid=r.invoice_uid;
  return true;
end;
$$;

revoke all on function public.claim_ac_pass_order_sync(text,text,jsonb,bigint) from public, anon, authenticated;
revoke all on function public.mark_ac_pass_order_write(uuid) from public, anon, authenticated;
revoke all on function public.finish_ac_pass_order_sync(uuid,text,text,text,bigint) from public, anon, authenticated;
grant execute on function public.claim_ac_pass_order_sync(text,text,jsonb,bigint) to service_role;
grant execute on function public.mark_ac_pass_order_write(uuid) to service_role;
grant execute on function public.finish_ac_pass_order_sync(uuid,text,text,text,bigint) to service_role;
comment on table public.ac_pass_payment_sync_receipts is 'AC-009 payment-to-order deduplication and readback receipts; service role only. No marketing permission or subscription authority.';
commit;

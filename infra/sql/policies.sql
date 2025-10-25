
-- =============================
-- Row Level Security Policies
-- =============================

-- Enable RLS
alter table public.users enable row level security;
alter table public.firms enable row level security;
alter table public.firm_contacts enable row level security;
alter table public.jobs enable row level security;
alter table public.resources enable row level security;
alter table public.user_activity enable row level security;
alter table public.embeddings enable row level security;
alter table public.entitlement_overrides enable row level security;

-- Public read for certain content to authenticated users (adjust as needed)
create policy "users_select_self"
on public.users for select
to authenticated
using ( id = auth.uid() );

create policy "users_upsert_self"
on public.users for insert
to authenticated
with check ( id = auth.uid() );

create policy "users_update_self"
on public.users for update
to authenticated
using ( id = auth.uid() );

-- Firms: readable by authenticated users, write via service role only (no insert/update policy here)
create policy "firms_read_auth"
on public.firms for select
to authenticated
using ( true );

-- Firm contacts
create policy "firm_contacts_read_auth"
on public.firm_contacts for select
to authenticated
using ( true );

-- Jobs
create policy "jobs_read_auth"
on public.jobs for select
to authenticated
using ( true );

-- Resources gating by access_level; let server verify entitlements in API for stricter control
create policy "resources_read_auth"
on public.resources for select
to authenticated
using ( true );

-- User activity: users can read/write their own via API; default no direct client writes (omit insert/update policies)
create policy "user_activity_read_own"
on public.user_activity for select
to authenticated
using ( user_id = auth.uid() );

-- Embeddings are server-managed; allow no client reads/writes by default
-- (No select/insert/update policies defined)

-- Entitlement overrides readable by server-only; keep client blocked
-- (No select policy)

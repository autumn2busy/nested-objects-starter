# Supabase RLS & Security Audit

## 1. RLS Policy Checklist

| Table | RLS Enabled | Policies Defined | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `public.profiles` | ❓ | Inferred from App | **Critical Review Needed** | Table missing from `infra/sql/schema.sql` but used in App. Likely exists in DB. App requires public/auth read for directory. |
| `public.users` | ✅ | `users_select_self`, etc. | **Legacy/Confusing** | Might be deprecated in favor of `profiles`. |
| `public.firms` | ✅ | `firms_read_auth` | **Pass** | Publicly readable by authenticated users. |
| `public.jobs` | ✅ | `jobs_own_select` vs `jobs_read_auth` | **Conflict** | `infra/sql/schema.sql` defines "own select", `policies.sql` defines "read auth". If both exist, "read auth" wins (broader). |
| `public.resources` | ✅ | `resources_read_auth` | **Pass** | Gated by application logic (plan check), data is readable by all auth users. |
| `storage.objects` | ❓ | Not found in SQL | **Verify in Dashboard** | Avatar upload logic (`avatar/route.ts`) acts as service role, so RLS on bucket might not be strictly enforced for *upload* if via API, but *public* access is enabled for viewing. |

## 2. Critical Findings & Issues

### 🚨 Issue 1: `profiles` vs `users` Ambiguity
- **Observation:** `infra/sql/schema.sql` defines `public.users`. The application (`route.ts`, `use-profile.ts`) explicitly queries `public.profiles`.
- **Risk:** Codebase schema definitions (`infra/sql`) are out of sync with the actual database state. This makes migrations and verified setups risky.
- **Recommendation:**
    1. Dump the current live schema using Supabase CLI (`supabase db dump`) to assert the source of truth.
    2. Update `infra/sql/schema.sql` to match the live `profiles` table.
    3. Clarify if `public.users` is deprecated and remove it if so.

### 🚨 Issue 2: RLS Policy Conflict on `jobs`
- **Observation:**
    - `infra/sql/schema.sql`: Defines strict "own data only" policies (`jobs_own_select`).
    - `infra/sql/policies.sql`: Defines broad "authenticated read" policy (`jobs_read_auth`).
- **Risk:** If `jobs_read_auth` is applied, **any authenticated user can see all jobs**, bypassing the "own data" restriction intended in `schema.sql`.
- **Recommendation:** Consolidate policies. If Jobs are private to the user/firm, remove `jobs_read_auth`.

### 🚨 Issue 3: Directory Access vs. RLS
- **Observation:** The Member Directory (`members/page.tsx`) fetches *all* profiles.
- **Risk:** If `profiles` RLS is set to "users can view own profile only" (standard privacy setup), the Directory page will return empty results for visitors.
- **Recommendation:** Ensure a policy exists: `create policy "Enable access to all users" on "public"."profiles" for select using (true);` (or limited to authenticated users).

### 🚨 Issue 4: "Founders" Plan Mapping Gap
- **Observation:** `lib/plan-config.ts` defines a `FOUNDERS` plan. However, `app/api/webhooks/outseta/route.ts` function `mapPlanToTier` does **not** handle "Founders". It defaults to 'free'.
- **Risk:** Founders plan members may not receive correct entitlements if they rely on `subscription_tier` being 'agency' or equivalent.
- **Recommendation:** Update `mapPlanToTier` in `route.ts` to map 'founders' to the appropriate tier (e.g., 'pro' or 'starter' + special flag).

## 3. Storage Security
- **Avatars:** Uploads are handled via `apps/web-members/app/api/profile/avatar/route.ts`.
- **Mechanism:** The API uses `SUPABASE_SERVICE_ROLE_KEY` to upload. This bypasses RLS.
- **Risk:** Application logic must strictly validate file types and sizes (which it does: 5MB limit, image types only).
- **Public Access:** Avatars are public. Ensure the `avatars` bucket is set to Public in Supabase Storage settings.

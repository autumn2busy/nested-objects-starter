# Migration & Readiness Report

## 1. Migration Readiness
**Status: ⚠️ Mixed/Risky**

- **Source of Truth Check:**
    - `infra/sql/schema.sql`: **STALE**. Contains `public.users` but missing `profiles`.
    - `supabase/migrations`: Contains recent seeds (`20260130...`).
    - **Risk:** Deploying `infra/sql/schema.sql` to a fresh environment will **break** the application because `profiles` table will be missing.
- **Action Items:**
    1. **Baseline Dump:** Run `supabase db dump > supabase/migrations/20260205_baseline_audit.sql` to capture the *actual* running schema (including `profiles`).
    2. **Sync `infra/sql`:** Update the reference documentation in `infra/sql` to match reality.

## 2. Data Seeding & Environments
- **Seeding Strategy:**
    - Found excellent modular seed files in `supabase/migrations` (`seed_module_1...`, `seed_structure...`).
    - **Readiness:** High. You can recreate the training content easily.
    - **Gap:** No seed data for `profiles` or `firms` found in migrations (likely relies on manual creation or "Firms Export" JSONs).
- **Environment Management:**
    - Use `supabase start` for local development.
    - Verify `profiles` table creation is scripted for new developers.

## 3. Backup & Restore
- **Backup Policy:**
    - Supabase (Pro) provides Point-in-Time Recovery (PITR). **Verify this is enabled** in the dashboard.
    - Daily backups are standard.
- **Restore Test:**
    - **Critical:** Have you tested restoring a backup to a separate project?
    - **Recommendation:** Perform a "Fire Drill". Create a new Supabase project and attempt to restore the latest backup or apply all migrations to verify it results in a working app.

## 4. Plan Mapping Summary
- **Current State:**
    - `lib/plan-config.ts` defines Plans (Free, Starter, Pro, Elite, Agency, Founders).
    - `api/webhooks/outseta/route.ts` maps incoming webhooks to Tiers.
- **Defect:** **"Founders" plan is missing** in the mapping logic.
- **Fix:** Update `route.ts` to explicitly handle the `Founders` plan UID (`pWrBRnWn`) or name string.

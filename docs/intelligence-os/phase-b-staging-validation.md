# Issue #318 Phase B staging validation record

> Superseded for current status, ownership, decisions, and next actions by `docs/intelligence-os/issue-318-foundation-execution-ledger.md`. This file remains dated technical evidence only and is not a competing implementation plan.

Validation date: 2026-08-25, America/New_York

Branch: `feature/318-phase-b-agent-runtime-foundation`

Migration:

`supabase/migrations/20260825090000_create_intelligence_os_foundation.sql`

Validation script:

`supabase/validation/20260825_validate_intelligence_os_foundation.sql`

## Environment

Autumn created a separate Supabase staging project for this validation. No production Supabase project, production records, production Vercel environment variables, or production deployment were used.

No project URL, API key, database password, service-role key, or connection string is recorded in this repository.

## Migration result

Autumn applied the Phase B migration through the staging Supabase SQL Editor and reported:

> Success. No rows returned.

This confirms that the complete migration transaction executed successfully in the staging Postgres environment.

## Validation result

Autumn then ran the rollback-safe validation script and reported:

> PASS: Intelligence OS Phase B staging validation completed. Synthetic records were rolled back.

The validation transaction checked:

- All required Phase B tables and private views exist.
- Row-level security is enabled on each control-plane table.
- `anon` and `authenticated` do not have direct control-plane table access.
- `service_role` has the required private read and write privileges.
- `member_360` and `member_authority_conflicts` are security-invoker views.
- The highest-ranked authoritative membership snapshot remains the member truth.
- A conflicting ActiveCampaign plan snapshot is surfaced instead of silently replacing product truth.
- ActiveCampaign cannot be marked authoritative for membership ownership.
- Unknown metrics must preserve `NULL` instead of using an invented zero.
- Experiments cannot record a conclusion before minimum sample-size and duration thresholds are satisfied.
- High-risk actions cannot bypass approval requirements.
- Agent actions cannot skip the proposed state.
- Approval-pending action payloads cannot be changed after review begins.
- An approval-required action cannot be approved without an explicit owner approval record.
- Agent actions cannot skip required execution lifecycle states.

All synthetic validation rows were enclosed in a transaction and rolled back.

## Confirmed governance decisions

- Outseta remains the upstream membership and entitlement authority.
- Supabase remains the application projection and shared operational memory.
- ActiveCampaign remains the marketing execution and lifecycle destination, not the authority for plan ownership, subscription state, churn, MRR, or ARR.
- A future verified Stripe synchronization may become authoritative for billing amounts.
- Autumn is the sole consequential-action approver for the initial release.
- A future delegated approver must have an explicit identity and scoped permissions.
- Existing JSON monitor reports remain for one parity cycle after Postgres-backed signals are introduced.
- The agent runtime is expected to become a separate Vercel project only after Phase C adds a real deployable entry point.

## Deliberately not validated here

- Production migration execution.
- Production member-data backfill.
- A live OpenAI model call.
- A deployed Vercel Workflow entry point.
- ActiveCampaign mutations.
- Email sending, content publication, pricing changes, subscription changes, pull-request merge, or production deployment.

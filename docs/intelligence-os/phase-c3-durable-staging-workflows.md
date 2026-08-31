# Phase C3 durable staging workflow operator guide

## Status and boundary

The repository implementation is complete and deny-by-default. Live staging application is intentionally blocked because the committed destination allowlist is empty and this checkout has no reviewed staging project reference or server-only credential.

Phase C3 is synthetic-only and Preview-only. It does not authorize a Production migration, Production environment variables, Production deployment or promotion, a schedule, model execution, email, content publication, or ActiveCampaign mutation. Existing reports and collectors remain active.

## What ships

- Pinned Workflow DevKit `4.8.5` with Nitro `3.0.260610-beta`; no Vercel Queues dependency.
- `lifecycle-integrity-check@phase-c3-v1`, implemented with a real `"use workflow"` entry point and bounded `"use step"` functions.
- Atomic business-idempotent run and step claims, first-writer workflow binding, leases, bounded retries, stale-run marking, completed-output reuse, and readback verification.
- A maximum 50-signal persistence batch. Recurrence updates evidence and observation metadata but does not reset the signal's review status.
- Correlation and causation IDs, timestamps, attempts, errors, tool summaries, verification state, and nullable usage/cost fields.
- Two-factor destination binding: a committed code allowlist and a service-role-only database sentinel with the same SHA-256 fingerprint.

## Required review sequence

Only Autumn may authorize the environment or database changes below. Perform them in this order against the dedicated staging resources.

1. Confirm the Supabase project is the dedicated staging project in the Supabase dashboard. Do not infer this from a local `.env` file, URL label, or credential.
2. Record the nonsecret staging project reference in the change review. Confirm it is not present in `deniedProjectRefs`.
3. Add that exact reference to `reviewedProjectRefs` in `apps/agent-runtime/src/runtime/staging-destination.ts` through a focused reviewed commit.
4. Compute the nonsecret fingerprint:

   ```text
   cd apps/agent-runtime
   node scripts/compute-staging-destination-fingerprint.mjs <reviewed-staging-project-ref>
   ```

5. Apply `supabase/migrations/20260827090000_create_durable_workflow_foundation.sql` through the normal staging migration path. Never run it against Production as part of Issue #318.
6. In a separate operator-reviewed staging migration or privileged transaction, insert the sentinel. The application service role deliberately has SELECT-only table access and cannot approve itself:

   ```sql
   INSERT INTO public.agent_runtime_destination_bindings (
       binding_key,
       policy_version,
       environment,
       project_ref,
       destination_fingerprint,
       review_status,
       reviewed_by,
       reviewed_at,
       review_evidence,
       active
   ) VALUES (
       'nested-objects-agent-runtime-staging',
       'phase-c3-v1',
       'staging',
       '<reviewed-staging-project-ref>',
       '<computed-fingerprint>',
       'approved',
       '<stable-owner-identifier>',
       now(),
       jsonb_build_object('change', '<review-or-ticket-reference>'),
       true
   );
   ```

7. Run `supabase/validation/20260827_validate_durable_workflow_foundation.sql` against staging. The script uses a transaction and finishes with `ROLLBACK`; confirm it reports the synthetic records were rolled back.
8. Configure only the Agent Runtime Vercel Preview/Development environments with:
   - `AGENT_RUNTIME_ENV=preview`
   - `AGENT_RUNTIME_MODE=dry_run`
   - `AGENT_MUTATIONS_ENABLED=false`
   - `AGENT_MODEL_EXECUTION_ENABLED=false`
   - `AGENT_WORKFLOW_PROVIDER=vercel_workflow`
   - `AGENT_RUNTIME_VERSION=phase-c3-v1`
   - `AGENT_DURABLE_PERSISTENCE_ENABLED=true`
   - `AGENT_DURABLE_SYNTHETIC_ONLY=true`
   - `AGENT_STAGING_WORKFLOW_TOKEN` set to a new random value of at least 32 characters
   - `AGENT_STAGING_PROJECT_REF` set to the reviewed nonsecret reference
   - `SUPABASE_URL` set to the matching hosted staging URL
   - `SUPABASE_SERVICE_ROLE_KEY` set through the secret environment channel
9. Deploy a Preview only. Verify `GET /api/health` reports the C3 profile as configuration-valid but does not claim the database sentinel was checked.
10. Submit the checked-in synthetic fixture to `POST /api/workflows/lifecycle-integrity`. A `202` means the start request passed code-side checks; the first durable step must independently verify the database sentinel.
11. Read back the run, steps, events, and signals. Confirm one verified successful run, equal evaluated/persisted signal counts, correlation continuity, no private reasoning, and no real member data.
12. Deliver the same business idempotency key again. Confirm the completed run and completed step outputs are reused without increasing their attempts or resetting status.

## Failure and rollback behavior

- A missing or unreviewed code binding, Production environment, denied project, hostname/reference mismatch, public/anonymous key, missing database sentinel, or inactive sentinel fails closed before business persistence.
- A transient step error records a bounded error and retry time. Workflow retry resumes completed steps; it does not repeat them.
- A live duplicate returns in-progress state. A completed duplicate returns stored output. A changed payload under the same idempotency key is rejected.
- The stale sweep uses `FOR UPDATE SKIP LOCKED` and a bounded batch. Reclaim is limited by `max_attempts`.
- To disable staging execution, first disable the Preview endpoint/token, then set the sentinel `active=false` through a reviewed privileged database change, and finally remove the project reference from the committed allowlist. Do not delete run history.
- If schema rollback is required before any wider dependency exists, use a separately reviewed down migration that revokes the C3 functions, drops `agent_workflow_steps` and `agent_runtime_destination_bindings`, and removes only the C3 columns from `agent_runs`. Never improvise a destructive rollback in Production.

## Local acceptance

From `apps/agent-runtime` on Node 22.16 or newer within major 22:

```text
npm ci
npm run format:check
npm run dependency:check
npm run typecheck
npm test
npm run test:workflow
npm run migration:check
npm run preview:check
```

The tests use only reserved synthetic identities and an injected in-memory staging policy. No staging credential is required for repository acceptance. Live migration and Preview smoke remain an explicit external gate.

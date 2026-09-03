# Phase C7 protected admin and approval surface

> Superseded for current status, ownership, decisions, and next actions by `docs/intelligence-os/issue-318-foundation-execution-ledger.md`. This file remains dated technical evidence only and is not a competing implementation plan.

Phase C7 adds one small owner-only staging surface for inspecting and triggering the durable Intelligence OS. It does not add an execution engine, Production endpoint, Production schedule, live connector, or delegated approver.

## Security boundary

The browser never calls the Agent Runtime directly and never receives a signing secret. The protected page at `/admin/intelligence-os` is a Next.js Server Component. Its Server Actions enforce all of these checks before forwarding a request:

1. Verify the existing Outseta session through the existing JWKS path.
2. Require `user.sub` to exactly equal the configured Autumn subject. Email, plan, account UID, subscription UID, and role claims cannot authorize the surface.
3. Require the request `Origin` to exactly match the reviewed staging origin and reject non-`same-origin` Fetch Metadata.
4. Verify a short-lived, purpose-bound HMAC form token.
5. Create a fresh UUID request nonce and sign the method, pathname, exact origin, stable subject, timestamp, nonce, and raw body SHA-256 with the server-only shared secret.

For a Vercel-protected Runtime Preview, `INTELLIGENCE_OS_AGENT_RUNTIME_BYPASS_SECRET` optionally supplies the server-only `x-vercel-protection-bypass` header. The destination must be HTTPS on a `.vercel.app` host; fetch redirects are rejected. This platform credential does not replace the signed owner authorization and is never placed in a URL or sent to the browser. Vercel Authentication remains enabled.

The Agent Runtime independently denies Vercel Production, requires the C3 reviewed staging binding, validates the complete HMAC contract within a five-minute window, and forwards the stable subject to service-role-only database functions. It does not accept a browser bearer token, email, role, query-string secret, `x-vercel-cron`, or unsigned request.

The database has the final authorization boundary. `agent_approvers` starts empty and permits only one active owner. Delegated rows are schema extension points but never satisfy `assert_agent_owner_subject`. A reviewed staging operator must insert Autumn's exact stable subject before any status read, trigger, or decision can succeed.

## Approval is not execution

`decide_agent_action` locks the proposed row and compares all of the following atomically:

- active stable owner subject;
- one-use nonce and bounded expiry;
- current `proposed` or `awaiting_approval` status;
- exact expected decision version;
- exact expected JSON payload;
- canonical payload SHA-256;
- decision idempotency key;
- absence of an executor and execution timestamps.

An approval-required action is first staged through `awaiting_approval`. Approval snapshots the exact payload and digest, increments the decision version, and emits durable `agent.action.awaiting_approval` and `agent.action.approved` events. Rejection emits `agent.action.rejected`. Both outcomes explicitly retain null executor and execution state. The lifecycle trigger prevents the approved payload, approval record, or correlation context from being altered later.

No C7 code can execute an approved action. No executor is registered or attached.

## Read surface

The owner page returns bounded, server-rendered views of:

- recent durable run status and verification;
- unresolved and high-priority signals;
- at most the latest three ranked operating priorities;
- proposed actions awaiting Autumn, including the exact payload, digest, evidence, source references, version, risk, and correlation ID;
- unhealthy or stale source observations and provenance mode;
- experiment sample and duration sufficiency;
- recent operating reviews and explicit Autumn decisions.

Run detail omits raw run and step input payloads. Snapshot access is service-role-only and still requires the stable owner registry check.

## Protected triggers

One endpoint maps protected requests into the existing shared C5 workflows:

| Trigger | Workflow | Contract |
| --- | --- | --- |
| Manual conversion | `conversion_review` | Deterministic synthetic fixture only |
| Daily health | `daily_business_health` | One shared health review, no independent agent schedule |
| Weekly operating | `weekly_operating_review` | One unified review, no specialist cron |
| Business event | `conversion_review` | One of the required event types and a synthetic/validation stable key |

Required event types are `member_created`, `trial_started`, `upgrade`, `downgrade`, `cancellation`, `payment_failure`, `paywall_hit`, `training_completion`, `firm_inquiry`, `opportunity_ingestion`, and `critical_integration_failure`.

Every C7 trigger is `fixtureMode=synthetic`. Synthetic observation time is derived deterministically from the stable business key rather than the HTTP receipt clock, so an exact business-key retry retains the same durable input fingerprint. The durable business idempotency key converges duplicate submissions, while the service nonce makes signed mutation replay observable and rejectable. The endpoint returns `202` after Workflow accepts the run and reports `mutationAllowed=false`.

No cron entry or Production schedule is added. A later rollout may bind existing event sources only after separate review; it must preserve the same authentication, idempotency, evidence, and no-execution boundaries.

## Schema and permission changes

`20260827130000_create_protected_admin_approval_surface.sql` adds:

- `agent_approvers` for reviewed stable subjects, initially empty;
- `agent_admin_request_nonces` for hashed one-use mutation and trigger nonces;
- decision version, immutable approved payload, digest, and decision idempotency fields on `agent_actions`;
- service-role-only nonce, snapshot, run-detail, action-read, and action-decision functions;
- a stricter action lifecycle trigger and direct service-role write revocations for `agent_actions` and `agent_events`.

The rollback-safe validation creates only synthetic owner/actions inside a transaction. It proves non-owner denial, nonce replay rejection, payload/version compare-and-set, immutable approval payload, durable approval/rejection events, no execution attachment, direct write denial, and finishes with `ROLLBACK`.

Run synthetic-owner validations before owner activation, or in a disposable database. They deliberately conflict with the single-active-owner constraint once the real staging owner is registered; do not remove that owner merely to rerun a fixture.

## Reviewed staging activation gate

Repository work does not authorize this activation. After Autumn separately approves the C3 staging destination, migration, secret channel, and exact Outseta subject:

1. Apply all prior C3/C5/C6 migrations to the reviewed staging database, then apply the C7 migration.
2. Run `supabase/validation/20260827_validate_protected_admin_approval_surface.sql` and confirm the rollback message.
3. Insert one reviewed active `owner` row for the exact Autumn `sub` through the normal audited staging migration/operator path. Do not insert an email or fallback account identifier.
4. Configure matching Preview/Development-only server variables:
   - Agent Runtime: `AGENT_ADMIN_ENABLED=true`, `AGENT_ADMIN_SHARED_SECRET`, `AGENT_ADMIN_AUTUMN_SUBJECT_ID`, `AGENT_ADMIN_ALLOWED_ORIGIN`.
   - Member web: `INTELLIGENCE_OS_ADMIN_ENABLED=true`, `INTELLIGENCE_OS_ADMIN_SHARED_SECRET`, `INTELLIGENCE_OS_AUTUMN_SUBJECT_ID`, `INTELLIGENCE_OS_ADMIN_ALLOWED_ORIGIN`, `INTELLIGENCE_OS_AGENT_RUNTIME_URL`.
5. Keep the shared secret server-only and identical across the two staging projects. The two origin variables must be the exact member-web staging origin.
6. Deploy Preview only, sign in as Autumn, and verify that any other logged-in identity is redirected.
7. Queue the three synthetic workflows and one synthetic event. Confirm durable nonce, run, step, review, signal, evidence, and correlation records.
8. Approve one synthetic proposal and reject another. Confirm both audit events, exact approved payload digest, incremented version, and null executor/execution timestamps.
9. Submit each mutation again and confirm replay/idempotency or compare-and-set rejection without a second side effect.

Never set these variables for Production, apply this migration to Production, add a Production schedule, or attach an executor as part of Issue #318.

### Issue #318 acceptance branch isolation

The user confirmed owner subject `9P66YMPm`. The operator script `supabase/operations/20260902_activate_issue318_staging_owner.sql` registered that owner and the reviewed destination binding in `wqstirwszdbsygstnvbn`. It is a one-time, staging-only operation, not an automatic migration.

Runtime and Members configuration is restricted to `codex/318-staging-acceptance`. Members must override both server and `NEXT_PUBLIC_` Supabase URL/key variables with staging values, rather than inherit the normal Preview database. Public URL/publishable-key variables are Config values; service credentials remain Secret values. Regular member features may be unavailable because this database contains Intelligence OS fixtures, not real member profiles.

When `VERCEL_ENV=preview` and `INTELLIGENCE_OS_ADMIN_ENABLED=true`, the Members layout omits GTM and ActiveCampaign tracking, server marketing helpers suppress events/tags, and the conversion endpoint returns 204 before rate-limiter, identity or database access. Production behavior is unchanged. Owner login is authentication only; business acceptance inputs remain synthetic.

## Local validation

```powershell
cd apps\agent-runtime
npm.cmd run validate

cd ..\web-members
npm.cmd run audit:intelligence-os-admin
node --test tests/intelligence-os-transport.test.mjs
npx.cmd tsc --noEmit
npm.cmd run lint
```

The Agent Runtime suite covers HMAC binding, wrong-subject and wrong-origin denial, body tampering, clock skew, every required trigger type, Production denial, database-style owner authorization, nonce replay, payload digest stability, decision compare-and-set, durable audits, and the no-execution outcome. Workflow fixtures execute protected event, daily, and weekly inputs through the actual shared Workflow entry points.

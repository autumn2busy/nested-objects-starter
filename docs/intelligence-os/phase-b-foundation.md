# Issue #318 Phase B architecture and implementation report

Branch: `feature/318-phase-b-agent-runtime-foundation`

Verified branch base at implementation start: `ac909c6ded28e39a19ac7b9d8d5956763f6eee29`

## 1. Context consolidation status

Project-context consolidation is complete and remains recorded in Obsidian. This implementation does not reopen the historical chat-merging or Phase A work. The live Issue #318 was reviewed in full. It had no comments at the time of inspection.

Phase B is treated as a foundation, not as permission to implement the complete Revenue, Growth, Industry, Marketing, Opportunity, Member Success, SEO/AEO, Product, Operations, or Engineering agents.

## 2. PR #317 and current-main baseline

The verified `main` baseline contains:

- PR #317, the Free-to-Paid conversion command center.
- PR #319, the firm-directory data-quality reconciliation.
- PR #320, the stale founders promotion cleanup.

`conversion_events` is retained as the raw first-party member behavior and conversion ledger. It already provides stable event IDs, anonymous IDs, session IDs, member IDs, email, plan context, attribution, event payload, timestamps, service-role-only storage, and idempotent upsert by `client_event_id`.

The browser tracker persists a stable anonymous ID and per-session ID. The server ingestion route adds authenticated Outseta member identity and plan context, then forwards authenticated lifecycle events to ActiveCampaign. The current conversion-funnel projection stitches anonymous events to a member when a later event carries both identities. The Outseta webhook remains the authoritative fallback for signup cohort creation and confirmed paid transitions.

Phase B does not change that ledger or substantially rewrite the conversion command center.

## 3. Current architecture discovered

The repository is a multi-application layout rather than a fully managed package workspace. `apps/web-members` is the primary Next.js 14.2.9 application and currently uses Zod 3.23.8. Root scripts still route installation and builds to `apps/web-members`. The repository-level `.nvmrc` is Node 20.

Supabase access is performed from server code with service-role credentials for private writes. Existing migrations generally enable RLS and use server-only mutation paths. There is no repository-generated database type contract covering the new control-plane schema.

Outseta webhook handling maps Person and Account payloads into the Supabase `profiles` projection, ignores older webhook versions, preserves stored paid context when a partial Person payload omits plan data, emits authoritative signup and paid conversion events, and then synchronizes lifecycle data to ActiveCampaign.

Authority discovered in the current code:

- Outseta-originated account and subscription data is the upstream product membership authority.
- Supabase `profiles` is the current application entitlement and member projection used by the product.
- ActiveCampaign is a downstream marketing and lifecycle destination. It is not authoritative for plan ownership.
- The current static plan-value helper is useful for lifecycle event labeling but is not billing-grade revenue evidence.
- No native Stripe customer or subscription synchronization path was found in the inspected repository. Stripe identifiers therefore remain an extension point, not an assumed source of truth.

Existing operational sensors remain inside `apps/web-members`:

- `seo-content-monitor` collects Google Search Console, GA4, and PageSpeed evidence and can return partial reports when a source is missing or fails.
- `ai-aeo-monitor` derives AEO visibility opportunities.
- `content-brief-generator` produces candidate briefs.
- Adzuna ingestion deduplicates and upserts opportunity records.
- Vercel cron invokes these routes on their current schedules, and several routes still commit JSON reports to GitHub.

No general durable workflow engine, queue consumer layer, or shared agent observability schema was found in the current baseline.

## 4. Existing components that will be reused

The following components are reused rather than rebuilt:

- `conversion_events` as the only raw first-party conversion and behavioral event ledger.
- Browser anonymous and session identity generation.
- Server-side authenticated conversion ingestion.
- Outseta webhook verification, freshness/idempotency checks, membership projection, and confirmed signup or paid-transition event generation.
- The current `profiles` entitlement projection.
- ActiveCampaign event forwarding and deep-data synchronization as downstream lifecycle delivery.
- SEO, AEO, Google data collection, content-brief, and Adzuna collectors as sensors.
- Existing audit scripts and member-app build conventions.

The agent runtime consumes normalized outputs or persisted records from these systems. It does not duplicate Google authentication, Adzuna collection, Outseta synchronization, or the conversion event route.

## 5. Proposed schema

### Canonical identity and `member_360`

Phase B uses a normalized identity set and a read-only view:

- `canonical_members` is the stable internal identity root.
- `member_identity_links` maps Supabase profile/user IDs, Outseta person/account IDs, ActiveCampaign contact IDs, future Stripe customer IDs, email addresses, and anonymous conversion actors to one canonical member.
- A unique source, identifier type, and normalized identifier constraint exposes collisions rather than silently merging two members.
- `member_memberships` stores versioned source snapshots with explicit authority, authority rank, plan, status, subscription dates, revenue state, completeness, confidence, provenance, and idempotency.
- `member_operational_profiles` stores the refreshable behavioral and profile projection. This includes geography, experience, profile/training completion, last seen, directory/firm/paywall/opportunity activity, acquisition attribution, and marketing engagement.
- `member_360` is a normal security-invoker view across these normalized structures.

`member_360` is deliberately not a materialized view in Phase B. A normal view avoids refresh scheduling, stale materialized data, and another deployment dependency while the projection write patterns are still being established. If later query volume justifies it, the same contract can be backed by a materialized projection without changing upstream authority rules.

`member_authority_conflicts` surfaces multiple authoritative snapshots, plan/status mismatches, and marketing claims that lack an authoritative product snapshot. The product may continue using the highest-ranked authoritative snapshot for access while the conflict remains visible for investigation.

### Membership and revenue authority

Outseta-originated account/subscription data is ranked highest. The Supabase profile projection can be stored as a lower-ranked authoritative application snapshot so lag or mapping errors become visible. ActiveCampaign is constrained from being authoritative. A future native Stripe source may become authoritative for billing amounts only after a verified synchronization path exists.

Paid status, churn, MRR, ARR, and subscription state are never inferred from ActiveCampaign. If billing-grade amounts are unavailable, revenue state is `unknown` and money fields remain `NULL`.

### `business_metrics_daily`

Daily metrics use a long-form design rather than a wide row. Each record includes metric date, name, domain, scope, dimensions, value, unit, optional numerator/denominator, observed and expected record counts, completeness, confidence, source system, source run, source references, provenance, correlation, causation, and idempotency.

`value_state` is one of `known`, `partial`, `unknown`, or `not_applicable`. Database checks require `NULL` for unknown or not-applicable values and require a numeric value for known or partial states. This prevents a missing MRR feed from becoming a misleading zero.

### Signals, experiments, and control-plane records

`intelligence_signals` stores durable business observations or interpretations worth investigation. It includes evidence, source references, confidence, severity, priority, business impact, affected entities, recommended follow-up, fingerprint, status, and correlation.

Signals differ from the other event types:

- `conversion_events` is raw first-party behavioral and conversion telemetry.
- `intelligence_signals` is normalized business meaning that should persist across runs.
- `agent_events` is internal orchestration and audit history.

`experiments` records a hypothesis, segment, primary/secondary metrics, baseline, target, guardrails, minimum sample size, minimum duration, observed evidence, result, confidence, and decision. Database checks prevent a result or decision until both minimum sample and minimum duration are met. The runtime also returns `insufficient_data` until both thresholds pass.

`agent_tasks`, `agent_actions`, `agent_runs`, and `agent_events` provide durable operational memory. Repeated deliveries use unique idempotency keys. Runs track workflow IDs, provider/model, inputs/outputs, concise rationale, tool summaries, token/cost fields, retries, timestamps, heartbeats, stale deadlines, errors, trace IDs, correlation, and causation.

`correlation_id` identifies the complete business thread. `causation_id` identifies the immediate signal, task, event, or action that caused the next record. This permits a source observation to be traced through investigation, recommendation, approval, execution, measurement, and learning.

All new tables use RLS, revoke `anon` and `authenticated`, and expose mutation only through server-only service-role paths.

## 6. Proposed runtime structure

`apps/agent-runtime` is a separately installable TypeScript package with its own Node 22.16+, Zod 4, current OpenAI Agents SDK, Supabase client, TypeScript configuration, environment validation, build, tests, and CI path.

The location is appropriate because:

- It isolates Zod 4 and current agent dependencies from the Next.js 14 member application and its Zod 3 contracts.
- It can be built and deployed independently.
- It keeps server-only credentials outside browser bundles.
- It gives durable workflows and later queue consumers a service boundary without forcing a member-app upgrade.

Runtime modules include:

- Typed contracts and validation.
- Membership authority and identity-conflict rules.
- Daily metric and experiment readiness rules.
- Task, action, and run state machines.
- Fail-closed approval policy.
- Server-only Supabase persistence.
- Disabled-by-default specialist and workflow registrations.
- Tool-free OpenAI structured-output adapter.
- Sensor adapter contracts.
- In-memory workflow adapter for deterministic tests.
- Explicit Vercel Workflow extension boundary.

Vercel Workflow is reserved for real multi-step flows that need replay, retries, pause/resume, or human approval. Workflow functions should orchestrate, while Node and SDK work should run in durable steps. Vercel Queues are not added in Phase B because no true event fan-out requirement has been established.

### Approval boundaries

Policy categorizes actions as internal, consequential, or unknown. Unknown actions fail closed as critical and approval-required. Consequential actions include email, outreach, ActiveCampaign mutation, automation start/stop, publishing, pricing/subscription changes, bulk production changes, risky repairs, paid data use, production deployment, pull-request merge, and destructive operations.

The action lifecycle is validated in TypeScript and Postgres. High/critical actions must require approval. Approval-required actions cannot reach approved or later states without an owner approval record. Proposal payload, target, risk, and idempotency contract become immutable once approval is pending. Approved actions cannot enter execution in Phase B because no consequential executor is registered and the runtime policy rejects that transition.

The model adapter has an empty tool list. It may return structured recommendations and proposed actions only.

## 7. Implementation phases

### Phase B, implemented now

- Isolated runtime package and validated environment contract.
- Normalized identity, membership, member projection, daily metric, signal, experiment, task, action, run, and event schema.
- RLS and server-only mutation boundary.
- Typed contracts and specialist/workflow/sensor registrations.
- Idempotency, lifecycle, correlation, stale-run, metric quality, experiment readiness, and membership-conflict helpers.
- Tool-free OpenAI Agents SDK adapter.
- In-memory workflow adapter for tests.
- Focused CI and unit tests.

### Phase C, recommended next

- Build deterministic projection jobs from `profiles` and `conversion_events` into canonical identity, current membership snapshots, member operational profiles, and daily metrics.
- Add lifecycle integrity detection and signals for missing identity, conflicting plans, entitlement mismatch, failed ActiveCampaign routing, and collector completeness.
- Add a real Vercel Workflow adapter for `lifecycle-integrity-check` after projection writes are stable.
- Implement Revenue Agent v1 against normalized metrics and authority conflicts.
- Implement Growth Agent v1 and the first unified operating review.
- Add owner-authenticated approval API/UI that writes approval records but still does not host external mutation executors.

### Later extension points

- Native Stripe billing synchronization and billing-grade revenue authority.
- Full SEO/AEO, Industry, Marketing, Opportunity, Member Success, Product, and Engineering specialist behavior.
- Vercel Queues only if independent consumers need fan-out from the same event.
- Materialized `member_360` only if measured query load warrants it.
- Approved external executors, one narrowly scoped action type at a time.

## 8. Conflicts, risks, assumptions, or decisions requiring Autumn

No blocking irreversible decision was required for Phase B. The following choices remain explicit review decisions before later phases:

1. Confirm whether Outseta remains the long-term upstream subscription authority or whether a future native Stripe integration will own billing amounts while Outseta owns entitlements.
2. Confirm the stable owner identity that the approval API will authenticate as Autumn. Phase B records `approval_authority = owner`, but it does not introduce an approval UI or delegated approvers.
3. Decide whether the runtime will be deployed as its own Vercel project or as a separately rooted service in the existing project after Phase C has a durable entry point.
4. Decide whether committed JSON monitor reports remain temporarily useful after signals begin persisting in Postgres.
5. Approve the migration and rollout order after preview validation. The migration has not been applied to production.

Known implementation limitations:

- No billing-grade Stripe source was found, so MRR/ARR remain unknown unless another authoritative source supplies actual amounts.
- The package lock could not be generated in the restricted implementation environment. CI uses `npm install`; a reviewed lockfile should be generated before merge if the repository requires deterministic installs.
- Static migration contract and SQL-shape checks ran. A disposable local Supabase/Postgres instance was unavailable, so actual migration execution remains a preview validation requirement.
- No production credentials were used. Model integration was not exercised against the OpenAI API.
- `apps/web-members` was not rebuilt because no shared member-app code changed and repository guidance discourages production builds during agent sessions. Existing regression checks should still run in the normal pull-request pipeline.

## 9. What will deliberately not be rebuilt

Phase B does not rebuild or replace:

- `conversion_events` or its anonymous-to-member stitching.
- The Free-to-Paid command center.
- Outseta webhook synchronization.
- ActiveCampaign deep-data and event forwarding.
- SEO Search Console, GA4, PageSpeed, or Google authentication logic.
- AEO collection.
- Content brief generation.
- Adzuna opportunity ingestion.
- Existing member entitlement logic.
- The full specialist agents.
- An unrestricted peer-to-peer agent mesh.
- An autonomous engineering-to-production path.
- A queue layer without demonstrated fan-out.
- Production deployment, migration execution, pull-request merge, email sending, publishing, pricing changes, subscription changes, or bulk data repair.

The engineering path remains: signal, recommendation, proposed engineering action, Autumn approval, branch, tests, pull request, Autumn approval, merge or deployment.

## Validation and rollout

### Local validation

```bash
cd apps/agent-runtime
npm install
npm run validate
```

### Migration rollout

1. Review the migration and authority rules in the pull request.
2. Generate and commit the package lock if deterministic install policy requires it.
3. Apply the migration to a disposable local or preview Supabase project.
4. Verify tables, views, constraints, triggers, grants, and RLS with service-role and anon credentials.
5. Run runtime tests and the existing web-member regression pipeline.
6. Deploy the runtime only after a real Phase C entry point exists.
7. Apply the migration to production only through the approved production migration process.

No production migrations, Vercel environment changes, deployments, ActiveCampaign changes, emails, content publication, or merges are part of Phase B.

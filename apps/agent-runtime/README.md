# Nested Objects Agent Runtime

Issue #318 foundation for the Nested Objects Intelligence OS.

Current program status, decisions, environment evidence, and rollout gates live only in the [canonical execution ledger](../../docs/intelligence-os/issue-318-foundation-execution-ledger.md). This README documents package behavior and must not be used as a deployment-status source.

This package is intentionally isolated from `apps/web-members`. It has its own Node, TypeScript, Zod, Supabase, and OpenAI Agents SDK dependency boundary so the Next.js 14 member application does not need a dependency upgrade to host agent code.

## Implemented foundation

### Phase B

- Typed specialist, signal, metric, task, action, event, run, workflow, evidence, retry, and correlation contracts.
- Fail-closed action-risk policy with explicit owner approval requirements.
- Validated task, action, and run state transitions.
- Idempotency and correlation propagation helpers.
- Server-only Supabase control-plane persistence.
- OpenAI Agents SDK structured-output adapter with no tools and no external mutation capability.
- In-memory durable-workflow test adapter and an explicit Vercel Workflow extension boundary.
- Adapter contracts for the existing conversion, SEO, AEO, content-brief, and Adzuna sensors.

### Phase C1. Projection and integrity

- Deterministic canonical member projection from Supabase `profiles` and the existing `conversion_events` ledger.
- Anonymous-to-member event stitching and duplicate-delivery detection.
- Identity collision detection without silent profile merging.
- Explicit Outseta and Supabase membership authority snapshots.
- Operational member projections and daily normalized metrics.
- Lifecycle integrity signals for access, plan, cancellation, onboarding, identity, and tracking conflicts.
- Read-only ActiveCampaign contact and asset classification for current members, churned members, Wix-era contacts, cold imports, internal contacts, tests, and unknown records.
- Private owner-reviewed ActiveCampaign asset registry. Candidate classification never grants connector access automatically.
- Server-only, retryable, idempotent projection persistence contracts for later durable workflows.

### Phase C2. Preview runtime entry point

- Independently deployable TypeScript HTTP handlers, retained as framework-neutral adapters and exposed through the Nitro server entry points.
- Public configuration-safe health endpoint at `GET /api/health`.
- Bearer-authenticated deterministic evaluation endpoint at `POST /api/preview/evaluate`.
- Preview-only and Vercel-production-denied execution guard.
- Reserved synthetic identity namespace. Every supplied UUID must match `31800000-xxxx-5xxx-8xxx/9xxx/axxx/bxxx`.
- External product, conversion, Outseta, attribution, and ActiveCampaign identifiers must begin with `synthetic-` or `validation-`.
- Synthetic-data-only request contract. Emails and domains must end in `.invalid`, state must be `ZZ`, profile and account labels must begin with `Synthetic` or `Validation`, and ActiveCampaign contact, lifecycle-mirror, and asset IDs must use synthetic prefixes.
- Phone numbers, profile biographies, profile headlines, conversion event payload values, nonempty ActiveCampaign custom fields, source-page values, and reason text are rejected.
- Bounded request sizes and record counts.
- Aggregate-only responses that omit emails, member IDs, contact IDs, evidence payloads, and raw source records.
- Strict dry-run execution with no Supabase credentials, database writes, or persistence mode.
- No OpenAI model execution, ActiveCampaign mutation, email send, content publication, approval execution, cron schedule, queue, or production write path.
- A minimal crawler-blocking `public/robots.txt`; Nitro packages only the explicit server routes and Workflow entry points.

Strict dry-run execution with no Supabase credentials, database writes, or persistence mode remains the Phase C2 default profile.

### Phase C3. Durable staging workflow foundation

- Nitro 3 hosts the HTTP boundary and the pinned Workflow DevKit compiles the real `"use workflow"` and bounded `"use step"` lifecycle workflow.
- A business idempotency key and input fingerprint atomically claim each run. Duplicate deliveries reuse completed output, live duplicates report in-progress state, and stale or failed work resumes only within bounded attempts.
- Durable step claims reuse completed output and never reset a completed step. Run and step events retain correlation, causation, timestamps, concise errors, tool summaries, verification state, and optional usage/cost fields.
- Signal persistence uses one bounded batch of at most 50 records and preserves existing signal review state on recurrence.
- The runtime rejects Vercel Production, the known production Supabase project, URL/project-reference mismatches, non-service credentials, and every staging project not reviewed in the committed allowlist.
- The database independently verifies a service-role-only destination sentinel before a workflow can claim a run. Runtime credentials cannot create or alter the sentinel.
- The committed allowlist contains the single staging project reviewed on 2026-09-02. The database sentinel, server-only credential, runtime environment, and Vercel target remain independent gates; an environment variable cannot approve another destination. Production remains explicitly denied.
- No queue package, model execution, ActiveCampaign mutation, email send, content publication, Production schedule, or Production deployment was added.

### Phase C4. Core specialist agents

- Revenue Agent compares normalized metrics only, preserves unknown values as null, and refuses to treat ActiveCampaign as financial truth.
- Growth Agent replaces the standalone weekly-analysis shape with current-week, prior-week, trailing-four-week, and trailing-twelve-week structured comparisons across signup, upgrade, churn, trial, directory, paywall, profile, training, opportunity, marketing, acquisition, and SEO metric families.
- Industry Intelligence Agent converts approved research observations into publication-dated, event-dated, licensed, source-addressable records and routes high-value evidence as durable signals. Live research remains disabled unless a read-only tool is explicitly approved and configured.
- Marketing Agent consumes Revenue and Growth outputs, defines identifier-free audiences, and produces recommendations, experiments, internal copy, and proposed actions. It never independently declares financial success or mutates ActiveCampaign.
- Operations Orchestrator invokes specialists through typed contracts, reads prior control-plane state, ranks no more than three meaningful priorities, creates task/experiment/action drafts, enforces the action policy, persists bounded operational state through an injected store, and stays quiet when evidence is not material.
- All five implementations use deterministic test doubles by default. Their structured results explicitly record no model use, no tokens/cost, no external mutation, concise rationale, evidence, source references, signals, proposed actions, and Autumn decisions only.
- Paid-access integrity now treats disabled, inactive, missing, or otherwise unrecognized `accessStatus` as a mismatch even when tier and directory flags look correct.

### Phase C5. Required operating workflows

- Real Workflow DevKit entry points implement the exact stable names `conversion_review`, `daily_business_health`, and `weekly_operating_review` at `phase-c5-v1`.
- Every workflow claims the C3 business-idempotent durable run, claims bounded evaluation and persistence steps, invokes the C4 Operations Orchestrator, persists a verified artifact batch, and completes the run with null model usage/cost.
- `conversion_review` requires Revenue, Growth, and Marketing inputs and persists an executive summary, signals, recommendations, tasks, experiment proposals, proposed actions, correlation, and causation.
- `daily_business_health` checks supplied lifecycle/identity/access/routing/tracking signals plus source freshness and collector failure observations. A healthy fixture stores one quiet review with zero signals, priorities, decisions, actions, or notification.
- `weekly_operating_review` can invoke all four specialists and persists no more than three priorities and no more than three explicit Autumn decisions.
- The Phase C5 migration adds private orchestrator-state, recommendation, and operating-review tables plus one bounded transactional artifact RPC. The runtime role receives SELECT-only table access and can write only through service-role-checked functions.
- Actions must remain non-mutating proposals with no executor or execution timestamps. Duplicate state, review, recommendation, task, experiment, and action keys reject changed payloads.
- No endpoint, cron, Production schedule, Production variable, migration application, notification sender, or external executor is enabled in this increment.

### Phase C6. Durable sensors and read-only marketing integrity

- The existing SEO, AEO, content-brief, conversion, and Adzuna collectors remain the collection authority. Typed adapters normalize their outputs or persisted records instead of rebuilding authentication or collection.
- SEO and AEO reports carry explicit `live`, `baseline`, or `fixture` provenance, source generation time, checksum, source health, staleness, stable record references, correlation, and causation. The weekly workflow receives report objects directly, persists their normalized observations first, and therefore does not depend on a same-deployment Git commit or build-time JSON import.
- Content briefs normalize to candidate actions with `mutationAllowed=false` and `publishAllowed=false`. Adzuna remains the deduplicated opportunity source for a later Opportunity Agent rather than an autonomous action path.
- `agent_sensor_runs` and `sensor_observations` provide bounded, idempotent, service-role-only durable ingestion. Changed content under a reused key fails closed; identical delivery reuses the existing run and observations.
- The ActiveCampaign adapter permits only bounded `GET` requests to one owner-reviewed hostname and stable-ID allowlist. It emits identifier-free marketing metrics, lifecycle/engagement signals, and approval-required cleanup proposals; it sends no email, mutates no asset, and cannot declare membership or revenue truth.
- ActiveCampaign classifications cover paid/free labeling conflicts, onboarding and nurture conflicts, post-purchase upgrade sequences, overlapping or stale automations, engagement decline, deliverability risk, high intent, cold never-engaged contacts, and internal contacts without returning email addresses.
- Projection authority joins ActiveCampaign evidence through the stored contact ID, not email. Contact-ID collisions are withheld as identity conflicts.
- Recurring asset inventory refreshes use an approval-preserving RPC and cannot reset owner review, read approval, reviewer identity, or the permanent mutation denial.
- No connector credential loader, endpoint, schedule, migration application, Production variable, external call, or mutation path is enabled in C6.

### Phase C7. Protected admin and immutable approval

- Nitro exposes HMAC-authenticated, bounded status, run-detail, synthetic-trigger, and action-decision endpoints. Signatures bind the stable subject, exact origin, method, pathname, timestamp, fresh nonce, and raw body digest.
- Runtime configuration rejects Vercel Production and still requires the C3 code-reviewed staging allowlist plus database destination sentinel.
- The database requires one active owner row keyed by Autumn's exact stable Outseta subject. Email and role fallback authorization is not accepted, and delegated approval remains disabled.
- Trigger contracts cover the three shared C5 workflows plus all required business-event types. Inputs are synthetic-only and converge through the existing durable business idempotency keys; no Production schedule or independent agent cron is added.
- Approval and rejection use one-use nonce consumption, row locking, expected payload/version compare-and-set, immutable approved payload snapshots, decision idempotency, and durable correlated events.
- Approval never executes. The decision path clears and rejects executor/execution state, and no executor capability is exposed.
- `apps/web-members` hosts the minimal owner-only Server Component. Same-origin Server Actions use short-lived purpose-bound form tokens and server-to-server signatures; the browser never receives the shared secret or calls this runtime directly.

### Phase C8. Traceability, learning memory, and projection hardening

- Recommendations retain their source signal IDs and correlation context. Durable operating persistence emits immutable links from workflow/source observations through signals, investigations, recommendations, experiments, and proposed actions.
- Owner approval/rejection preserves the action correlation in a dedicated approval-state trace link and still does not execute the action.
- Typed outcomes, planned/later measurements, and candidate learnings complete the evidence-backed operating loop. Completed measurements require the committed minimum sample and duration; changed content under an idempotency key fails closed.
- The database exposes an owner-only correlation trace read model and SELECT-only direct access to trace, outcome, measurement, and learning tables. Writes use bounded service-role RPCs.
- Private chain-of-thought fields are rejected by runtime contracts, static validation, tests, and database JSON checks. Only concise rationale, evidence, decisions, outcomes, and candidate learnings are stored.
- Anonymous IDs claimed by more than one explicit member now produce an order-independent collision and never stitch anonymous-only events. Projection-managed identity links absent from a later snapshot are auditably revoked rather than left active.
- No Production migration, schedule, connector, model, external mutation executor, or deployment was added.

## Endpoints

### `GET /api/health`

Returns only safe configuration state, such as whether the preview token is present and whether forbidden database configuration was detected. It never returns secret values, database URLs, or project references.

### `POST /api/preview/evaluate`

Requires:

```text
Authorization: Bearer <AGENT_PREVIEW_API_TOKEN>
Content-Type: application/json
```

The endpoint accepts bounded synthetic fixtures, runs the deterministic Phase C core in memory, and returns aggregate counts, signal types, metric states, contact classifications, asset candidate scopes, and explicit safety flags.

The request must use:

```json
{
  "persist": false
}
```

The runtime rejects:

- `persist: true`
- Supabase URLs or service-role credentials
- Staging project references
- Vercel Production
- Any environment other than `preview`
- Any mode other than `dry_run`
- Model execution
- Mutation flags
- UUIDs outside the reserved Phase C2 fixture namespace
- External identifiers without synthetic markers
- Real email addresses, domains, geographic states, or unmarked labels
- Phone, biography, headline, custom-field, and conversion event payload values

### `POST /api/workflows/lifecycle-integrity`

This endpoint accepts the same bounded synthetic fixture contract and uses a separate bearer token, `AGENT_STAGING_WORKFLOW_TOKEN`. It returns `202` only after the committed staging policy and server-only credential shape pass. The workflow's first durable step then verifies the matching database sentinel before any run or signal write.

When the configured project, reviewed code allowlist, database sentinel, credential shape, or Preview-only runtime gate does not match, the endpoint deliberately returns a sanitized failure and `/api/health` reports the C3 configuration as invalid. A configured environment variable cannot approve its own destination.

### Protected C7 admin endpoints

- `GET /api/admin/snapshot`
- `GET /api/admin/runs/:runId`
- `POST /api/admin/triggers`
- `POST /api/admin/actions/:actionId/decision`

These endpoints are staging-only and require the complete `nested-objects-admin-v1` service signature. The browser-facing page is documented in `docs/intelligence-os/phase-c7-protected-admin-approval.md`. The migration creates an empty owner registry; the reviewed staging activation operation registered one owner for acceptance. Repository code alone still cannot activate access in another environment.

## Local validation

```bash
cd apps/agent-runtime
npm ci
cp .env.example .env
npm run validate
```

`npm run test:workflow` compiles and executes the real Workflow directives with `@workflow/vitest`. It proves C3 duplicate/retry/resume behavior, all three C5 operating flows, durable weekly SEO/AEO sensor reuse, C7 protected-trigger fixture routing, and C8 correlated artifact links using only synthetic in-memory persistence. `npm run migration:check` validates the Phase B, C1, C3, C5, C6, C7, and C8 migration contracts without contacting a database.

`npm run specialists:check` enforces the Phase C4 implementation registrations and deterministic, proposal-only capability boundary. The Node suite exercises all five specialists and the inactive paid-access regression without an OpenAI key.

Node 22.16 or newer within the Node 22 release line is required by this isolated package. The upper bound prevents Vercel from overriding the project runtime with a newer major version. The repository-level Node setting and `apps/web-members` dependencies remain unchanged.

The root TypeScript configuration intentionally infers its source root. Local builds include only `src/` and retain the existing private `dist` layout, while Vercel can add `api/` Function entries without excluding them from emission.

## Vercel project boundary

The runtime uses the separate Vercel project created for Phase C2:

```text
Repository: autumn2busy/nested-objects-starter
Root Directory: apps/agent-runtime
Project name: nested-objects-agent-runtime
Production Branch: deploy/agent-runtime-production-disabled
```

For the C2 profile, use Preview and Development variables only and do not configure Supabase credentials. For the C3 profile, follow `docs/intelligence-os/phase-c3-durable-staging-workflows.md`; add a staging destination only after its code allowlist and database sentinel are reviewed together. Do not configure Production variables, OpenAI credentials, a Production schedule, or a Production deployment.

## Package structure

```text
api/              Framework-neutral HTTP adapters retained for focused tests
public/           Minimal non-indexable static output required by the Vercel project
server/api/       Nitro HTTP entry points for health, C2 evaluation, and C3 workflow start
src/
  agents/         Implemented deterministic v1 specialists, registrations, and optional tool-free OpenAI adapter
  http/           Request validation, authentication, signatures, health, and response contracts
  learning/       Observation-to-learning trace contracts and private-reasoning denial
  persistence/    Phase B and C1 server-only persistence contracts for later durable workflows
  projections/    Canonical member and daily metric projectors
  runtime/        Dry-run evaluation plus deny-by-default durable staging binding
  sensors/        Existing collector contracts and ActiveCampaign read-only audit
  workflows/      Workflow ports and deterministic lifecycle integrity core
workflows/        Real Workflow DevKit orchestration and bounded durable steps
```

Architecture and rollout details are documented under `docs/intelligence-os/`.

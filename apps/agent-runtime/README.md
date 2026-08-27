# Nested Objects Agent Runtime

Issue #318 foundation for the Nested Objects Intelligence OS.

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
- The committed allowlist is intentionally empty. The code, migration, rollback-safe validation, and synthetic tests are complete, while live staging application remains blocked until Autumn reviews the exact nonsecret staging project reference and supplies its server-only credential through the approved environment channel.
- No queue package, model execution, ActiveCampaign mutation, email send, content publication, Production schedule, or Production deployment was added.

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

Until a reviewed staging project is committed, the endpoint deliberately returns a sanitized `503` and `/api/health` reports the C3 configuration as invalid. A configured environment variable cannot approve its own destination.

## Local validation

```bash
cd apps/agent-runtime
npm ci
cp .env.example .env
npm run validate
```

`npm run test:workflow` compiles and executes the real Workflow directives with `@workflow/vitest`. It proves duplicate delivery reuse and retry/resume behavior using only synthetic in-memory persistence. `npm run migration:check` validates the Phase B, C1, and C3 migration contracts without contacting a database.

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
  agents/         Specialist registrations and tool-free OpenAI adapter
  http/           Request validation, authentication, health, and response contracts
  persistence/    Phase B and C1 server-only persistence contracts for later durable workflows
  projections/    Canonical member and daily metric projectors
  runtime/        Dry-run evaluation plus deny-by-default durable staging binding
  sensors/        Existing collector contracts and ActiveCampaign read-only audit
  workflows/      Workflow ports and deterministic lifecycle integrity core
workflows/        Real Workflow DevKit orchestration and bounded durable steps
```

Architecture and rollout details are documented under `docs/intelligence-os/`.

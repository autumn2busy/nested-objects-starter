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
- Server-only, retryable, idempotent projection persistence.

### Phase C2. Preview runtime entry point

- Plain TypeScript Vercel Functions under `api/` so the runtime can deploy independently from the member application.
- Public configuration-safe health endpoint at `GET /api/health`.
- Bearer-authenticated deterministic evaluation endpoint at `POST /api/preview/evaluate`.
- Preview-only and Vercel-production-denied execution guard.
- Synthetic-data-only request contract. Preview emails must end in `.invalid`, phone numbers are rejected, and ActiveCampaign IDs must use `synthetic-` or `validation-` prefixes.
- Bounded request sizes and record counts.
- Aggregate-only responses that omit emails, member IDs, contact IDs, evidence payloads, and raw source records.
- Dry-run default. Optional persistence is separately gated and verifies the exact staging Supabase project reference before accepting service-role credentials.
- No OpenAI model execution, ActiveCampaign mutation, email send, content publication, approval execution, cron schedule, queue, or production write path.

Phase C2 deliberately does not install Vercel Workflow yet. The first deployment proves authentication, packaging, synthetic evaluation, and staging persistence boundaries. Durable workflow orchestration can then be introduced for the first real lifecycle-integrity run without mixing deployment troubleshooting with workflow semantics.

## Endpoints

### `GET /api/health`

Returns only safe configuration state, such as whether the preview token and staging configuration are present. It never returns secret values or database URLs.

### `POST /api/preview/evaluate`

Requires:

```text
Authorization: Bearer <AGENT_PREVIEW_API_TOKEN>
Content-Type: application/json
```

The endpoint accepts bounded synthetic fixtures, runs the deterministic Phase C core, and returns aggregate counts, signal types, metric states, contact classifications, asset candidate scopes, and explicit safety flags.

`persist` must remain `false` for the first deployment. Later staging persistence requires all of the following:

```text
AGENT_PREVIEW_PERSISTENCE_ENABLED=true
AGENT_STAGING_PROJECT_REF=<exact staging project ref>
SUPABASE_URL=https://<exact staging project ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<staging secret key>
```

The runtime rejects a mismatched Supabase host, Vercel Production, non-preview runtime mode, model execution, mutation flags, and non-synthetic input.

## Local validation

```bash
cd apps/agent-runtime
npm ci
cp .env.example .env
npm run validate
```

Node 22.16 or newer is required by this isolated package. The repository-level Node setting and `apps/web-members` dependencies remain unchanged.

## Vercel project boundary

When Phase C2 is approved for preview deployment, create a separate Vercel project from the existing repository:

```text
Repository: autumn2busy/nested-objects-starter
Root Directory: apps/agent-runtime
Project name: nested-objects-agent-runtime
```

Use Preview and Development environment variables only. Do not configure Production credentials or enable production deployment during Phase C2.

## Package structure

```text
api/              Preview-only Vercel Function entry points
src/
  agents/         Specialist registrations and tool-free OpenAI adapter
  http/           Request validation, authentication, health, and response contracts
  persistence/    Server-only control-plane, projection, and projection-run persistence
  projections/    Canonical member and daily metric projectors
  runtime/        Preview evaluation composition
  sensors/        Existing collector contracts and ActiveCampaign read-only audit
  workflows/      Durable workflow ports and lifecycle integrity core
```

Architecture and rollout details are documented under `docs/intelligence-os/`.

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

- Plain TypeScript Vercel Functions under `api/` so the runtime can deploy independently from the member application.
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

Phase C2 deliberately does not install Vercel Workflow. The first deployment proves authentication, packaging, synthetic evaluation, and production isolation. Durable workflow orchestration and staging persistence move to the next increment so destination binding, idempotency, bounded steps, retries, and verification can be implemented together.

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

## Local validation

```bash
cd apps/agent-runtime
npm ci
cp .env.example .env
npm run validate
```

Node 22.16 or newer within the Node 22 release line is required by this isolated package. The upper bound prevents Vercel from overriding the project runtime with a newer major version. The repository-level Node setting and `apps/web-members` dependencies remain unchanged.

## Vercel project boundary

When Phase C2 is approved for preview deployment, create a separate Vercel project from the existing repository:

```text
Repository: autumn2busy/nested-objects-starter
Root Directory: apps/agent-runtime
Project name: nested-objects-agent-runtime
Production Branch: deploy/agent-runtime-production-disabled
```

Use Preview and Development environment variables only. Do not configure Production variables, OpenAI credentials, Supabase credentials, or a production deployment during Phase C2.

## Package structure

```text
api/              Preview-only Vercel Function entry points
src/
  agents/         Specialist registrations and tool-free OpenAI adapter
  http/           Request validation, authentication, health, and response contracts
  persistence/    Phase B and C1 server-only persistence contracts for later durable workflows
  projections/    Canonical member and daily metric projectors
  runtime/        Dry-run preview evaluation composition
  sensors/        Existing collector contracts and ActiveCampaign read-only audit
  workflows/      Durable workflow ports and lifecycle integrity core
```

Architecture and rollout details are documented under `docs/intelligence-os/`.

# Issue #318 Phase C2. Preview runtime entry point

Branch:

```text
feature/318-phase-c2-preview-runtime-entrypoint
```

Base commit:

```text
1ace8ec942044493e3e4e1e0cd5dee0c4081c8bc
```

## Objective

Make `apps/agent-runtime` independently deployable to a separate Vercel Preview project without enabling production behavior, autonomous agents, real-contact processing, or consequential external mutations.

Phase C2 proves the deployment and security boundary around the deterministic Phase C1 intelligence core. It does not yet add Vercel Workflow, Vercel Queues, model execution, a cron schedule, or a live ActiveCampaign connector executor.

## Runtime endpoints

### `GET /api/health`

Public, no-cache, configuration-safe health response. It exposes boolean readiness state only. It does not reveal tokens, Supabase credentials, database URLs, project references, source records, or contact information.

### `POST /api/preview/evaluate`

Bearer-authenticated, preview-only deterministic evaluation. It accepts bounded synthetic fixtures and returns only aggregate counts and classifications.

The endpoint rejects:

- Vercel Production
- Any runtime environment other than `preview`
- Model execution
- Mutation enablement
- A workflow provider other than `in_memory`
- Missing or weak preview bearer tokens
- Payloads over 1.5 MB
- More than 100 profiles
- More than 1,000 conversion events
- More than 250 ActiveCampaign contact fixtures
- More than 500 ActiveCampaign asset fixtures
- Email addresses that do not end in `.invalid`
- Phone numbers
- ActiveCampaign contact or asset IDs without `synthetic-` or `validation-` prefixes

Responses omit emails, member identifiers, ActiveCampaign identifiers, raw evidence, source records, and action payloads.

## Persistence boundary

The first Preview deployment must use:

```text
AGENT_PREVIEW_PERSISTENCE_ENABLED=false
```

A later staging-only persistence test may set it to `true` after the dry-run smoke test passes. Persistence then requires the exact staging project reference and refuses a Supabase URL whose hostname does not equal:

```text
<AGENT_STAGING_PROJECT_REF>.supabase.co
```

Allowed staging writes are limited to the reviewed private operational tables and deterministic projections already established in Phases B and C1. ActiveCampaign is never mutated.

## Why Vercel Workflow is not installed in this increment

The current evaluation is bounded, deterministic, and completes in one request. Adding durable workflow orchestration before the basic deployment, authentication, packaging, and staging connection boundaries are proven would combine too many failure modes.

The next increment should add Vercel Workflow when the first real lifecycle-integrity execution needs persisted steps, retries, and resumability. Vercel Queues should remain deferred until one source event genuinely needs independent fan-out to multiple consumers.

## Vercel project configuration after review approval

Create a separate project using:

```text
Project name: nested-objects-agent-runtime
Repository: autumn2busy/nested-objects-starter
Root Directory: apps/agent-runtime
Production Branch: main
```

For the first deployment, import the Phase C2 feature branch as a Preview deployment. Do not promote it to Production.

Preview and Development variables:

```text
AGENT_RUNTIME_ENV=preview
AGENT_RUNTIME_MODE=dry_run
AGENT_MUTATIONS_ENABLED=false
AGENT_MODEL_EXECUTION_ENABLED=false
AGENT_WORKFLOW_PROVIDER=in_memory
AGENT_RUNTIME_VERSION=phase-c2-v1
AGENT_TRACE_NAMESPACE=nested-objects-intelligence-os
AGENT_PREVIEW_API_TOKEN=<random secret of at least 32 characters>
AGENT_PREVIEW_SYNTHETIC_ONLY=true
AGENT_PREVIEW_PERSISTENCE_ENABLED=false
```

Do not add OpenAI or Supabase credentials for the first dry-run deployment.

## Smoke-test sequence

1. Deploy the Phase C2 branch to Vercel Preview.
2. Confirm `GET /api/health` returns HTTP 200 and `ok: true`.
3. Confirm an unauthenticated evaluation returns HTTP 401.
4. Confirm a real email address is rejected with HTTP 400.
5. Submit the reviewed synthetic fixture with `persist: false`.
6. Confirm the response contains aggregate counts only and explicit false safety flags for ActiveCampaign mutation, model execution, production writes, and consequential executors.
7. Only after those checks pass, add staging Supabase variables to Preview and set `AGENT_PREVIEW_PERSISTENCE_ENABLED=true` for a separately approved staging write test.
8. Verify the staging projection run and synthetic records, then remove the synthetic projection records or retain them under an explicit validation label.
9. Keep all Production environment variables empty and do not promote the deployment.

## Deliberate non-goals

- No real member or contact data
- No production database connection
- No ActiveCampaign API or MCP mutation
- No email or outreach
- No content publishing
- No pricing or subscription change
- No production deployment
- No automatic pull-request merge
- No Revenue Agent or Growth Agent model behavior
- No approval execution UI

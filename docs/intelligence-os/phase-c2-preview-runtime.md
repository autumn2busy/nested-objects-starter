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

Make `apps/agent-runtime` independently deployable to a separate Vercel Preview project without enabling production behavior, autonomous agents, real-member processing, real-contact processing, database writes, or consequential external mutations.

Phase C2 proves the deployment and security boundary around the deterministic Phase C1 intelligence core. It does not add Vercel Workflow, Vercel Queues, model execution, a cron schedule, a database persistence path, or a live ActiveCampaign connector executor.

## Runtime endpoints

### `GET /api/health`

Public, no-cache, configuration-safe health response. It exposes boolean readiness state only. It does not reveal tokens, credentials, database URLs, project references, source records, or contact information.

Health is fail-closed. Invalid boolean values, a non-preview runtime, Vercel Production, a mode other than `dry_run`, model execution, mutation enablement, a non-memory workflow provider, a weak or missing token, Supabase credentials, a staging project reference, or an attempt to enable persistence produce HTTP 503 with `ok: false`.

### `POST /api/preview/evaluate`

Bearer-authenticated, preview-only deterministic evaluation. It accepts bounded synthetic fixtures and returns only aggregate counts and classifications.

The endpoint rejects:

- Vercel Production
- Any runtime environment other than `preview`
- Any runtime mode other than `dry_run`
- Model execution
- Mutation enablement
- Database persistence
- Supabase credentials or staging project references
- A workflow provider other than `in_memory`
- Missing or weak preview bearer tokens
- Payloads over 1.5 MB
- More than 100 profiles
- More than 1,000 conversion events
- More than 250 ActiveCampaign contact fixtures
- More than 500 ActiveCampaign asset fixtures
- UUIDs outside the reserved Phase C2 fixture namespace
- External IDs without `synthetic-` or `validation-` prefixes
- Email addresses or domains that do not end in `.invalid`
- Geographic states other than the reserved `ZZ` value
- Profile, service, ActiveCampaign tag, list, or asset labels without `Synthetic` or `Validation` markers
- Phone numbers, profile headlines, profile biographies, conversion event payload values, ActiveCampaign custom-field values, source-page values, and reason text

Responses omit emails, member identifiers, ActiveCampaign identifiers, raw evidence, source records, and action payloads.

## Reserved synthetic identity policy

Phase C2 must not process a production member merely because the email address was replaced with a `.invalid` address.

All supplied UUIDs must use this reserved fixture format:

```text
31800000-xxxx-5xxx-8xxx/9xxx/axxx/bxxx-xxxxxxxxxxxx
```

The `31800000` prefix identifies Issue #318 preview fixtures. The version and variant bits remain valid UUID values. The reserved namespace covers:

- Canonical profile IDs
- Supabase user IDs
- Conversion event IDs
- Correlation IDs
- Causation IDs
- Product-access map keys and member IDs
- Lifecycle-mirror map keys

All supplied non-UUID identifiers must begin with:

```text
synthetic-
```

or:

```text
validation-
```

That rule covers Outseta person and account IDs, plan IDs, anonymous IDs, session IDs, client event IDs, member UIDs, source and UTM identifiers, ActiveCampaign contact IDs, lifecycle-mirror contact IDs, and ActiveCampaign asset IDs.

Free-text surfaces are intentionally narrow. Labels must be visibly marked synthetic, profile biography and headline fields are empty, event payload objects and ActiveCampaign custom-field objects are empty, and internal domains end in `.invalid`.

## Database boundary

Phase C2 has no database write capability.

The following must not be configured in its Vercel project:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
AGENT_STAGING_PROJECT_REF
```

The following must remain false:

```text
AGENT_PREVIEW_PERSISTENCE_ENABLED=false
```

A request containing `persist: true` is rejected. Removing the write path also prevents partial writes under a Vercel timeout and prevents retries from resetting a previously completed projection run.

Staging persistence moves to the next durable-workflow increment. That implementation must bind to an independently reviewed staging destination rather than trusting a URL and project reference supplied together at runtime. It must also use durable idempotent step claims, bounded writes, retries, and explicit verification.

## Why Vercel Workflow is not installed in this increment

The current evaluation is bounded, deterministic, read-only, and completes in one request. Adding durable workflow orchestration before deployment, authentication, packaging, and synthetic-input boundaries are proven would combine too many failure modes.

The next increment should add Vercel Workflow for the first persisted lifecycle-integrity execution that needs durable steps, retries, resumability, and a verified staging destination. Vercel Queues remain deferred until one source event genuinely needs independent fan-out to multiple consumers.

## Vercel project configuration after review approval

Create a separate project using:

```text
Project name: nested-objects-agent-runtime
Repository: autumn2busy/nested-objects-starter
Root Directory: apps/agent-runtime
Production Branch: deploy/agent-runtime-production-disabled
```

The dedicated production-disabled branch is pinned to the merged Phase C1 baseline. It prevents merging Phase C2 into `main` from automatically becoming a production agent-runtime deployment. Do not change the Production Branch to `main` until a later production rollout receives explicit approval.

The first useful deployment must come from the Phase C2 feature branch as a Preview deployment. Do not promote it to Production.

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

Do not add OpenAI or Supabase credentials. Keep every Production environment variable empty.

## Smoke-test sequence

1. Create the separate Vercel project and confirm its Production Branch is `deploy/agent-runtime-production-disabled` before a Phase C2 deployment.
2. Add the safe variables above to Preview and Development only.
3. Deploy or redeploy `feature/318-phase-c2-preview-runtime-entrypoint` as a Vercel Preview.
4. Confirm `GET /api/health` returns HTTP 200 with `ok: true` and `configurationValid: true`.
5. Confirm an unauthenticated evaluation returns HTTP 401.
6. Confirm a real email address is rejected with HTTP 400.
7. Confirm a normal production-shaped UUID is rejected with HTTP 400.
8. Confirm an unmarked Outseta or lifecycle-mirror contact ID is rejected with HTTP 400.
9. Confirm nonempty ActiveCampaign custom fields are rejected with HTTP 400.
10. Confirm a request with `persist: true` is rejected.
11. Submit `fixtures/preview-evaluation.synthetic.json` with `persist: false`.
12. Confirm the response contains aggregate counts only and explicit false safety flags for ActiveCampaign mutation, model execution, production writes, and consequential executors.
13. Keep all Production environment variables empty and do not promote the deployment.

## Codex review resolution

The Phase C2 review cycle identified these persistence and privacy risks:

1. A URL and project reference supplied together could both point to Production.
2. A lifecycle mirror could contain a real ActiveCampaign contact ID.
3. A retry could reset a previously completed projection run.
4. Serial persistence could exceed the Vercel function duration and leave partial staging writes.
5. ActiveCampaign custom-field values could contain real contact data.
6. The operator README contained obsolete persistence and service-role setup instructions.
7. A real profile UUID or Outseta identity could be supplied behind a synthetic email address.

Phase C2 resolves them by removing database persistence entirely, rejecting database configuration, enforcing reserved UUIDs and synthetic external identifiers, eliminating free-text contact and event payload surfaces, and correcting all operator guidance. Durable staging writes are deliberately deferred to the workflow increment designed to solve destination binding, idempotency, bounded execution, and retry semantics together.

## Deliberate non-goals

- No real member or contact data
- No database credentials or writes
- No production database connection
- No ActiveCampaign API or MCP mutation
- No email or outreach
- No content publishing
- No pricing or subscription change
- No production deployment
- No automatic pull-request merge
- No Revenue Agent or Growth Agent model behavior
- No approval execution UI

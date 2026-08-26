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

### Phase C projection and integrity increment

- Deterministic canonical member projection from Supabase `profiles` and the existing `conversion_events` ledger.
- Anonymous-to-member event stitching and duplicate-delivery detection.
- Identity collision detection without silent profile merging.
- Explicit Outseta and Supabase membership authority snapshots.
- Operational member projections and daily normalized metrics.
- Lifecycle integrity signals for access, plan, cancellation, onboarding, identity, and tracking conflicts.
- Read-only ActiveCampaign contact and asset classification for current members, churned members, Wix-era contacts, cold imports, internal contacts, tests, and unknown records.
- Private owner-reviewed ActiveCampaign asset registry. Candidate classification never grants connector access automatically.
- Server-only, retryable, idempotent projection persistence.

## Deliberate safety limits

The runtime does not register any tool that can send email, change ActiveCampaign, publish content, change pricing or subscriptions, repair production data, deploy, merge pull requests, or perform destructive operations.

Consequential actions stop as persisted proposals. ActiveCampaign asset mutations are database-blocked in the current Phase C migration. Contact classifications are recommendations only. They do not unsubscribe, delete, retag, merge, enroll, suppress, or email anyone.

Private chain-of-thought is never persisted. The contracts store operational inputs, structured outputs, evidence, concise rationale, tool summaries, status, cost metadata, errors, and outcomes only.

## Local setup

```bash
cd apps/agent-runtime
npm ci
cp .env.example .env
npm run validate
```

Node 22.16 or newer is required by this isolated package. The repository-level Node setting and `apps/web-members` dependencies remain unchanged.

## Environment variables

`AGENT_RUNTIME_ENV`, `AGENT_RUNTIME_MODE`, `AGENT_MUTATIONS_ENABLED`, `AGENT_MODEL_EXECUTION_ENABLED`, `AGENT_WORKFLOW_PROVIDER`, `AGENT_RUNTIME_VERSION`, and `AGENT_TRACE_NAMESPACE` configure the host.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are required together for database persistence. The runtime rejects browser execution, Supabase publishable keys, and legacy JWT credentials whose role is not `service_role`.

`OPENAI_API_KEY`, `OPENAI_AGENT_MODEL`, and optionally `OPENAI_AGENT_MAX_TURNS` are required only when model execution is enabled. Model execution remains analytical, structured-output-only, and tool-free.

## Package structure

```text
src/
  agents/          Specialist registrations and tool-free OpenAI adapter
  persistence/     Server-only control-plane and projection persistence
  projections/     Canonical member and daily metric projectors
  sensors/         Existing collector contracts and ActiveCampaign read-only audit
  workflows/       Durable workflow ports and lifecycle integrity core
  contracts.ts     Shared typed contracts
  env.ts           Environment validation and safe defaults
  stable-id.ts     Stable deterministic operational UUIDs
  identity-authority.ts
  idempotency.ts
  lifecycle.ts
  metrics.ts
  policy.ts
```

Architecture and rollout details are documented under `docs/intelligence-os/`.

# Nested Objects Agent Runtime

Issue #318 Phase B foundation for the Nested Objects Intelligence OS.

This package is intentionally isolated from `apps/web-members`. It has its own Node, TypeScript, Zod, Supabase, and OpenAI Agents SDK dependency boundary so the Next.js 14 member application does not need a dependency upgrade to host agent code.

## Phase B capabilities

- Typed specialist, signal, metric, task, action, event, run, workflow, evidence, retry, and correlation contracts.
- Fail-closed action-risk policy with explicit owner approval requirements.
- Validated task, action, and run state transitions.
- Idempotency and correlation propagation helpers.
- Server-only Supabase control-plane persistence.
- Current OpenAI Agents SDK structured-output adapter with no tools and no external mutation capability.
- In-memory durable-workflow test adapter and an explicit Vercel Workflow extension boundary.
- Adapter contracts for the existing conversion, SEO, AEO, content-brief, and Adzuna sensors.
- Focused unit tests that run without production credentials.

## Deliberate safety limits

Phase B does not register any tool that can send email, change ActiveCampaign, publish content, change pricing or subscriptions, repair production data, deploy, merge pull requests, or perform destructive operations.

Consequential actions stop as persisted proposals. Even an approved consequential action cannot transition into execution because no external executor is installed and the Phase B policy denies that transition.

Private chain-of-thought is never persisted. The contracts store operational inputs, structured outputs, evidence, concise rationale, tool summaries, status, cost metadata, errors, and outcomes.

## Local setup

```bash
cd apps/agent-runtime
npm install
cp .env.example .env
npm run validate
```

Node 22.16 or newer is required by this isolated package. The repository-level Node 20 setting and `apps/web-members` dependencies remain unchanged.

## Environment variables

`AGENT_RUNTIME_ENV`, `AGENT_RUNTIME_MODE`, `AGENT_MUTATIONS_ENABLED`, `AGENT_MODEL_EXECUTION_ENABLED`, `AGENT_WORKFLOW_PROVIDER`, `AGENT_RUNTIME_VERSION`, and `AGENT_TRACE_NAMESPACE` configure the host.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are required together for database persistence. The runtime rejects browser execution, Supabase publishable keys, and legacy JWT credentials whose role is not `service_role`.

`OPENAI_API_KEY`, `OPENAI_AGENT_MODEL`, and optionally `OPENAI_AGENT_MAX_TURNS` are required only when model execution is enabled. Model execution remains analytical, structured-output-only, and tool-free.

## Package structure

```text
src/
  agents/          Specialist registrations and tool-free OpenAI adapter
  persistence/     Server-only control-plane store boundary
  sensors/         Existing collector adapter contracts
  workflows/       Durable workflow port, registrations, and test implementation
  contracts.ts     Shared typed contracts
  env.ts           Environment validation and safe defaults
  identity-authority.ts
  idempotency.ts
  lifecycle.ts
  metrics.ts
  policy.ts
```

The full schema, authority model, rollout sequence, and Phase C extension points are documented in `docs/intelligence-os/phase-b-foundation.md`.

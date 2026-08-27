# Phase C5 operating-review workflows

## Outcome and boundary

The three required operating workflows are implemented as real Workflow DevKit functions with C3 durable run/step claims and C4 specialist invocation. Repository acceptance uses deterministic fixtures and in-memory stores. Live staging migration and smoke remain blocked by the same empty C3 destination allowlist and missing Autumn-reviewed staging credential.

No schedule, public trigger, notification sender, model call, ActiveCampaign write, external mutation executor, Production variable, Production migration, or Production deployment is part of C5.

## Shared durable sequence

Each `phase-c5-v1` workflow performs this sequence:

1. Validate the namespaced business idempotency key and bounded fixture.
2. Atomically claim or reuse the durable `agent_runs` record through C3.
3. Claim the workflow-specific evaluation step.
4. Invoke Operations Orchestrator with persisted signals, metrics, experiments, open tasks, and prior actions.
5. Persist the Orchestrator state idempotently.
6. Build a bounded artifact batch: at most 50 signals, 20 recommendations, 10 tasks, 10 experiments, 10 actions, one review, three priorities, and three Autumn decisions.
7. Claim the persistence step and write the batch transactionally.
8. Read back returned counts and require exact agreement with the intended batch.
9. Complete the durable run with verified output, null tokens/cost, and correlation/causation continuity.

Completed runs and completed steps are reused. Live duplicates report in-progress state. Changed state or artifact payloads under an existing idempotency key fail closed. A transient step failure records a bounded error and retry timestamp; completed prior steps are reused on resume.

## `conversion_review`

`conversion_review` requires typed Revenue, Growth, and Marketing inputs. It gathers normalized metrics and relevant lifecycle signals, then persists:

- Revenue assessments without invented financial values.
- Growth diagnosis and durable anomalies.
- Marketing recommendations, identifier-free audiences, experiment proposals, internal copy metadata, and proposed actions.
- A concise executive summary, ranked priorities, pending tasks, and explicit Autumn decisions.

No action is executed. ActiveCampaign proposals remain `proposed`, approval-required, executor-free, and timestamp-free.

## `daily_business_health`

`daily_business_health` consumes existing lifecycle signals covering identity stitching, access/plan state, onboarding, cancellation propagation, and stale tracking. It also evaluates bounded source-health observations for degraded/failed state, missing freshness timestamps, stale collection, and collector errors.

The healthy fixture proves the quiet contract:

- `quiet=true`
- `notificationRequired=false`
- zero signals
- zero priorities
- zero Autumn decisions
- zero actions
- one persisted quiet review

A degraded source produces one evidence-backed operating signal and priority as appropriate, without generating a verbose daily narrative.

## `weekly_operating_review`

`weekly_operating_review` invokes Revenue, Growth, Industry Intelligence, and Marketing when their typed inputs are present. It combines new and unresolved persisted signals, suppresses duplicate open tasks/experiments/actions, correlates related metric evidence, and persists at most three priorities.

C6 will attach live/baseline-provenanced SEO and AEO sensor output. Until then, the C5 weekly fixture validates the complete durable specialist and artifact path without pretending deployment-static JSON is live evidence.

## Schema and permissions

`20260827110000_create_operating_workflow_artifacts.sql` adds:

- `agent_orchestrator_states`
- `agent_recommendations`
- `agent_operating_reviews`
- `persist_agent_orchestrator_state(...)`
- `persist_agent_operating_workflow_batch(...)`

The service role has SELECT-only access to the three new tables. Writes occur only inside service-role-checked `SECURITY DEFINER` functions. The batch function requires a matching running durable workflow, enforces all record bounds, reuses the C3 signal upsert without resetting signal status, persists only proposed actions, rejects any executor/execution timestamp/mutation flag, and records a correlated persistence event.

The rollback-safe validation creates synthetic state, a conversion review with one artifact of each type, a duplicate delivery, and a quiet daily review inside one transaction. It confirms changed state rejection, stable counts, no duplicate artifacts, the approval/no-execution action boundary, and quiet zero-signal behavior, then rolls everything back.

## Staging operator gate

After the C3 staging reference, code allowlist, database sentinel, service credential, and migration are explicitly approved:

1. Apply the C5 migration through the normal staging migration path after C3.
2. Run `supabase/validation/20260827_validate_operating_workflow_artifacts.sql` against staging and confirm its final rollback message.
3. Deploy Preview only with the already reviewed C3 configuration.
4. Start each workflow with a reserved synthetic fixture through the protected C7 trigger once C7 exists; until then, use an operator-controlled Preview test harness only.
5. Verify run, step, event, state, review, recommendation, task, experiment, action, and signal correlation without real member data.
6. Deliver each business idempotency key twice and confirm one durable run/review and unchanged completed attempts.
7. Confirm the daily healthy fixture creates no notification and every action remains unexecuted.

Do not apply the migration, configure a schedule, or expose a trigger in Production as part of Issue #318.

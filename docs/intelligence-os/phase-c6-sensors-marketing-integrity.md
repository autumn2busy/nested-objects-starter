# Phase C6 durable sensors and marketing integrity

> Superseded for current status, ownership, decisions, and next actions by `docs/intelligence-os/issue-318-foundation-execution-ledger.md`. This file remains dated technical evidence only and is not a competing implementation plan.

## Outcome and boundary

Phase C6 preserves every working collector and adds a typed, provenance-aware ingestion boundary between collector output and the Intelligence OS. SEO and AEO observations can now enter `weekly_operating_review` in the same invocation that produced them, be stored idempotently, and become evidence-backed signals before the C5 operating artifacts are persisted.

Content briefs remain downstream draft candidates. Adzuna remains the existing deduplicated opportunity source. ActiveCampaign is a read-only marketing sensor only: Outseta and Supabase remain membership and access authority, normalized financial sources remain revenue authority, and no ActiveCampaign mutation or email capability is exposed.

This increment does not add a connector credential loader, route, cron, schedule, notification, migration application, Production variable, Production deployment, or external call. The checked-in reports and their current collectors remain active until the parity gate below succeeds.

## Existing collector integration map

| Existing source | C6 integration | Intelligence OS output | Authority boundary |
| --- | --- | --- | --- |
| `seo-content-monitor` | Existing report-shape adapter | Durable observations and SEO opportunity/source-health signals | Collector retains Google authentication and collection. |
| `ai-aeo-monitor` | Existing report-shape adapter | Durable observations and AEO opportunity/source-health signals | Evidence only; never an automatic publishing instruction. Raw answer snapshots are not copied into the ledger. |
| `content-brief-generator` | Existing report-shape adapter | Durable observations plus proposal-only content actions | `mutationAllowed=false`; `publishAllowed=false`; Autumn approval remains required. |
| Conversion event ledger | Existing persisted ledger contract | Normalized projection and conversion metrics | No duplicate raw-event architecture. |
| Adzuna ingestion | Existing persisted-job contract | Opportunity source for a later Opportunity Agent | Existing importer owns collection and deduplication. |
| ActiveCampaign | New bounded GET-only adapter and deterministic classifier | Marketing metrics, lifecycle/engagement signals, and cleanup proposals | Never membership, paid-access, or revenue authority; no write tool. |

## Provenance and report compatibility

Every sensor batch records:

- `live`, `baseline`, or `fixture` provenance;
- source generation and observation timestamps;
- a deterministic SHA-256 content checksum;
- source-level health, record count, staleness threshold, and sanitized error code;
- stable source record references and deterministic idempotency keys;
- correlation and causation IDs;
- normalized observations, metrics, signals, and candidate actions.

The adapters accept the existing checked-in SEO, AEO, and content-brief JSON shapes without changing the collectors. The current June 2026 reports are correctly classified as stale baselines, not live observations. Weekly callers pass fresh report objects directly into the workflow; they do not wait for a report commit to be included in a later application deployment.

The compatibility layer and checked-in reports must be retained through one successful parity cycle. Removal requires a recorded comparison showing matching record counts, stable references, expected signals, source health, and no unexpected candidate actions.

## Weekly durable sequence

For `weekly_operating_review@phase-c5-v1`:

1. The caller supplies bounded SEO/AEO report objects with an explicit provenance mode.
2. C6 adapters validate the existing report shapes and normalize at most 100 observations per batch.
3. A dedicated durable step persists each sensor run and its observations through `persist_agent_sensor_batch`.
4. Duplicate identical delivery reuses the same run and records; changed content under the same idempotency key fails closed.
5. Normalized sensor signals join persisted operating signals before the C4 specialists and Orchestrator run.
6. C5 persists the resulting bounded review artifacts and verifies the returned counts.

Non-weekly workflows reject sensor reports so collection evidence cannot silently enter the wrong operating cadence.

## ActiveCampaign read-only boundary

The client requires an injected owner-reviewed allowlist containing a review ID, stable Autumn subject, review timestamp, account ID, exact HTTPS account hostname, stable resource IDs, and `mutationAllowed=false`. Reads use only `GET`, `no-store`, a bounded timeout, pagination limits from 1 through 100, and sanitized failures. A contact inventory scope must be explicitly allowed; automation reads must use individual allowlisted IDs. Unknown hosts, resources, methods, and bounds fail closed.

The deterministic sensor emits no email addresses and no raw custom-field values. It classifies and signals:

- paid members labeled Free;
- canceled members still in paid nurture;
- free members in paid automations;
- members missing onboarding;
- upgrade sequences continuing after purchase;
- overlapping lifecycle automations;
- stale automations;
- engagement decline;
- deliverability risk;
- high-intent segments;
- cold, never-engaged contacts;
- internal ActiveCampaign contacts.

All cleanup recommendations are proposed actions with no executor or execution timestamps. They require Autumn approval and still do not execute when approved; an executor is outside Issue #318.

ActiveCampaign contact evidence joins canonical authority only through `profiles.ac_contact_id` and an active, non-conflicting identity link. Email equality cannot confer authority. Duplicate contact IDs are recorded as identity conflicts and withheld from persistence-safe links.

## Durable schema and permissions

`20260827120000_create_sensor_observation_ledger.sql` adds private `agent_sensor_runs` and `sensor_observations` tables plus two service-role-checked functions:

- `persist_agent_sensor_batch(JSONB, JSONB)` atomically validates and stores a maximum of 100 normalized observations. Runtime table access is SELECT-only.
- `upsert_activecampaign_asset_inventory(JSONB)` refreshes classifier metadata without resetting an approved or rejected scope, `read_allowed`, `mutation_allowed`, reviewer identity, review time, or review notes. Direct service-role writes to the asset registry are revoked.

The rollback-safe validation proves duplicate sensor reuse, changed-payload rejection, direct permission denial, and approval-preserving recurring inventory refresh, then removes every synthetic row with `ROLLBACK`.

## Merged finding corrections

Phase C6 resolves two findings carried from merged Phase C1:

- recurring inventory refresh no longer resets owner approval or read authorization;
- contact authority no longer joins by email and instead uses the stored ActiveCampaign contact ID with collision handling.

The anonymous-ID ambiguity and stale identity-link revocation findings remain assigned to C8.

## One-cycle parity gate

After C3 staging binding and migration application are explicitly approved, retain the old collectors and reports and run one synthetic or safely bounded staging cycle:

1. Record the exact collector versions, report checksums, generated timestamps, counts, and source health.
2. Ingest the same SEO/AEO report objects through the protected C7 staging trigger.
3. Compare normalized observation counts and stable references with the original report records.
4. Compare expected SEO/AEO signals and confirm stale/baseline inputs are never described as live.
5. Run content-brief compatibility separately and confirm every downstream action remains unpublished and mutation-disabled.
6. Confirm the weekly review consumes the new observations in the same invocation and still returns at most three priorities and three Autumn decisions.
7. Record duplicate delivery reuse and changed-payload rejection.
8. Mark parity successful only when differences are understood and accepted. Keep the old report path if any item fails.

## Staging operator gate

No live application is authorized by this document. After Autumn approves the C3 staging project reference, database sentinel, secret channel, and migrations:

1. Apply the C6 migration through the normal staging migration path after C3 and C5.
2. Run `supabase/validation/20260827_validate_sensor_observation_ledger.sql` and confirm its final rollback message.
3. Deploy Preview only with the reviewed C3 destination binding.
4. Use the protected C7 trigger with deterministic SEO/AEO fixtures and no ActiveCampaign credential first.
5. Inspect run, observation, signal, review, correlation, causation, and duplicate-reuse records.
6. Only if separately approved, inject a read-only ActiveCampaign credential through the server-only secret channel and an owner-reviewed stable-ID allowlist. Use a bounded account inventory window; do not send email or invoke any mutation module.
7. Record the parity result before considering retirement of an old report path.

Do not configure a Production schedule, Production variable, Production migration, or Production deployment as part of Issue #318.

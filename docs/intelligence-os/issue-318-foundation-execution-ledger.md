# Issue #318 Intelligence OS Foundation execution ledger

Last updated: 2026-08-27, America/New_York

This is the durable source of truth for the remaining Issue #318 program. Update it in every stacked increment. Chat history is not authoritative.

## Repository and stack state

| Item | Verified state |
| --- | --- |
| Repository | `autumn2busy/nested-objects-starter` |
| Latest fetched `origin/main` | `7e1eab8100b80f42c274816fbb7bf254edaa7545` |
| Phase C2 verification head / corrective-increment stack base | `7e5bd39b69361dbd75c983dce7fcf96b65337b9b` |
| Current increment | Phase C6 durable sensors and marketing integrity |
| Current branch | `feature/318-c6-sensors-marketing-integrity` at C5 base `c5ac01d` |
| Current draft PR | Not opened; the private corrective/C3 branch push requires explicit user approval |
| Production-disabled runtime branch | `deploy/agent-runtime-production-disabled`, intentionally pinned to `1ace8ec942044493e3e4e1e0cd5dee0c4081c8bc` |
| Production deployment/migration authorization | Not granted |
| Consequential-action approver | Autumn only |
| Delegated approval | Extension point only; disabled |

## Safety invariants

- Do not merge pull requests, deploy or promote Production, change the Agent Runtime Production Branch to `main`, apply a production migration, add Production variables, or attach a production/custom domain.
- Do not connect the Agent Runtime to production Supabase or copy production members/contacts into staging.
- Do not send email, publish content, mutate ActiveCampaign, change pricing/subscriptions/entitlements, perform bulk cleanup, or attach an external mutation executor.
- Model execution remains disabled by default. Tests must pass without an OpenAI key.
- Persist operational inputs, structured outputs, evidence, concise rationale, decisions, tool metadata, status, errors, usage, outcomes, and learning only. Never persist private chain-of-thought.
- Existing collectors and scheduled reports remain until a successful parity cycle proves the replacement path.

## Verified completed prerequisites

| Work | Status | Evidence |
| --- | --- | --- |
| PR #317 conversion command center | Complete and merged | Existing `conversion_events` remains the sole raw first-party behavior/conversion ledger; identity stitching and authoritative Outseta events are reused. |
| PR #320 stale founders banner removal | Complete and merged | Repository checkpoint and `origin/main`. |
| PR #321 Phase B control-plane foundation | Complete and merged | Runtime contracts, identity/membership schema, metrics, signals, experiments, control-plane tables, approval guards, RLS, correlation/causation. |
| PR #322 Phase C1 projections and lifecycle integrity | Merged with four unresolved findings | Deterministic member projections, metrics, lifecycle signals, marketing classifications, asset registry, staging migration and validation; see the hardening ledger below. |
| PR #323 Phase C2 preview runtime entry point | Complete and merged | Health/evaluation endpoints, synthetic-only validation, aggregate-only responses, no persistence/model/mutations. |
| PR #325 member-surface correction | Merged, but implementation failed | The merge contains only two one-shot workflow files. Every apply run failed before jobs started, so no product files changed. The broken workflows must be removed and the correction implemented directly. |
| PR #324 | Incorrect decision; keep open until replacement lands | Do not merge or cherry-pick. Its Free-member functional-calculator decision is superseded conceptually, but the repository implementation is not yet superseded. |
| PR #326 Phase C2 live deployment verification | Complete, draft, unmerged | Head `7e5bd39`; isolated Preview is READY; live smoke matrix and checks passed; Production remains non-live with zero Production variables/domains. |
| Supabase Phase B staging migration/validation | Complete | `20260825090000_create_intelligence_os_foundation.sql` and rollback-safe validation passed in dedicated staging. |
| Supabase Phase C1 staging migration/validation | Complete | `20260826090000_create_phase_c_projection_and_marketing_registry.sql` and rollback-safe validation passed in dedicated staging. |

## Live Issue #318 definition-of-done matrix

Live Issue #318 was read on 2026-08-26. It is open, has no comments, and its definition-of-done wording has not changed.

| # | Definition of done | Status | Repository evidence / responsible increment | Remaining validation or blocker |
| ---: | --- | --- | --- | --- |
| 1 | PR #317 explicitly reconciled; no duplicate conversion-event architecture | Complete | PR #317; `conversion_events`; Phase B/C docs | Preserve architecture in all later increments. |
| 2 | `apps/agent-runtime` exists and builds independently | Complete | PRs #321/#323/#326; isolated package and CI | Revalidate after every increment. |
| 3 | Canonical `member_360` projection/source-of-truth strategy exists | Partial | Phase B/C migrations, projection code, authority-conflict view | Fix ambiguous anonymous-ID attribution and stale identity-link revocation before calling the projection correct. |
| 4 | `business_metrics_daily` exists | Complete | Phase B migration and Phase C daily projector | Extend only with provenance and unknown preservation. |
| 5 | `intelligence_signals` exists | Complete | Phase B migration/contracts/store | Prove end-to-end production path with fixtures. |
| 6 | `experiments` exists | Complete | Phase B migration/contracts/readiness logic | Integrate into weekly review and admin status. |
| 7 | Agent control-plane persistence exists | Repository-complete; live staging application blocked | C3 durable store, Workflow entry point, atomic run/step RPCs, committed destination policy, migration and validation | Autumn must review the exact staging project reference, database sentinel, secret channel, migration, and Preview smoke. |
| 8 | Operations Orchestrator v1 exists | Complete locally | C4 typed invocation plus C5 durable state/artifact persistence in all three operating workflows | Live staging persistence remains gated by the C3 destination review. |
| 9 | Revenue Agent v1 exists | Complete locally | C4 normalized-metric comparisons, authority/data-quality states, unknown preservation, evidenced drivers only | No model or live financial connector is required. |
| 10 | Growth Agent v1 replaces standalone Weekly Growth Analysis logic | Complete locally | C4 current/prior week and trailing 4/12-week comparisons, coverage/confidence, typed anomalies and durable signals; C5 invokes it durably and C6 supplies durable SEO/AEO signals | Live staging persistence remains gated by the C3 destination review. |
| 11 | Industry Intelligence Agent v1 replaces standalone AI Industry Brief logic | Complete locally | C4 dated/provenanced/licensed structured events, high-value routing, deterministic research fixtures | Approved live read-only research remains disabled until an explicit tool is configured. |
| 12 | Marketing Agent v1 exists | Complete locally | C4 Revenue/Growth consumption, lifecycle/engagement diagnosis, identifier-free audiences, experiments, internal copy, policy-gated proposals | ActiveCampaign remains read-only/no mutation. |
| 13 | Existing SEO/AEO/content/opportunity collectors have documented sensor integration; weekly review consumes SEO/AEO | Complete locally | C6 preserves collector/report shapes, adds live/baseline/fixture provenance, checksums, health/staleness, stable references, idempotent ingestion, proposal-only content briefs, documented Adzuna opportunity ownership, and direct same-invocation weekly SEO/AEO consumption | One staging parity cycle remains gated by the C3 destination review and later C7 protected trigger. |
| 14 | `conversion_review` runs end-to-end against mocks/dev data | Complete locally | C5 real Workflow fixture, durable run/step reuse, specialist invocation, transactional artifact persistence, readback verification, and duplicate-delivery test | Live staging smoke remains gated by the C3 destination review. |
| 15 | `daily_business_health` runs and stays quiet when healthy | Complete locally | C5 source/staleness evaluation and healthy fixture with `quiet=true`, no notification, no signals/priorities/decisions/actions | Live staging smoke remains gated by the C3 destination review. |
| 16 | `weekly_operating_review` runs end-to-end and returns no more than three priorities plus Autumn decisions | Complete locally | C5 proves the durable specialist/artifact path and C6 proves direct SEO/AEO adaptation, durable observation reuse, signal consumption, and unchanged three-priority/three-decision bounds | Live staging smoke remains gated by the C3 destination review. |
| 17 | External mutations are code-gated by approval | Partial | Phase B TypeScript/Postgres guards; no executor | C7/C8: stable Autumn subject, origin/CSRF and replay defenses, atomic decision update, immutable approved payload, no execution attachment. Do not reuse email/role fallback auth. |
| 18 | Correlation IDs allow signal -> action -> outcome audit | Partial | C5 persists one correlated run/step/signal/recommendation/task/experiment/proposed-action/review trace and verifies duplicate reuse | C8: add outcome measurement/linkage and full observation-to-learning acceptance. |
| 19 | Tests/builds pass | Partial | C2 checks pass; PR #325 left an invalid workflow on `main` that fails on every push | Remove both one-shot workflows, then run the full matrix for every stacked increment and final audit. |
| 20 | Documentation explains future Opportunity, Inbox/Member Success, SEO, Product, Lead, and Codex Engineering agents | Partial | Phase B docs contain high-level extension points | C8: complete `docs/agent-control-plane.md` and implementation summary. |

## Execution-brief additions to the live definition of done

| Requirement | Status | Responsible increment / blocker |
| --- | --- | --- |
| Independent Preview deployment and full Phase C2 live smoke verification | Complete | Draft PR #326 and `phase-c2-preview-deployment-verification.md`. |
| Real Vercel Workflow implementation | Repository-complete | C3 pins Workflow `4.8.5`, compiles a real lifecycle workflow, and executes it under `@workflow/vitest`. |
| Staging persistence with reviewed destination binding | Repository-complete / live application blocked | Code allowlist is intentionally empty; live application requires Autumn-reviewed staging reference, database sentinel, and server-only secret credential. |
| Executable stale-run detection and resume-safe semantics | Repository-complete | C3 atomic RPCs, retry windows, bounded stale sweep, duplicate delivery, and completed-step reuse tests. |
| Read-only ActiveCampaign sensor and lifecycle/performance signals | Complete locally | C6 bounded GET-only client, owner-reviewed hostname/stable-ID allowlist, email-free stable-ID classifications, durable marketing metrics/signals, proposal-only cleanup, and stable contact-ID authority join. Live credential use remains disabled. |
| Minimal protected run/signal/priority/approval surface | Missing | C7. |
| Trigger contracts and protected endpoints; no Production schedule | Missing | C7. |
| One-cycle parity plan and retained old reports | Repository-complete / execution blocked | C6 documents the exact compatibility comparison and keeps the old collectors/reports. Execution requires the approved C3 staging binding and C7 protected trigger. |
| Full observation-to-learning trace and measurement linkage | Missing | C8. |

## Cross-increment architecture findings

- C3 should begin with one synthetic-only durable workflow, `lifecycle-integrity-check@c3-v1`, and use Workflow's managed durability rather than adding Vercel Queues without a real fan-out requirement.
- C3 must use atomic business-idempotency claims, first-writer Workflow binding, bounded transactional persistence, readback verification, dispatch leases, and at-least-once semantics. Do not claim exactly-once execution.
- A committed allowlist plus a service-role-only database sentinel must bind Preview to the reviewed staging destination. Environment variables alone are not sufficient proof, and the known production project must always be rejected.
- C5 must implement the exact stable workflow names `conversion_review`, `daily_business_health`, and `weekly_operating_review`; healthy daily fixtures must stay quiet and weekly review must emit at most three priorities.
- C6 must preserve existing SEO/AEO/content report shapes for one parity cycle while distinguishing fixture/baseline/live observations and recording source health, staleness, checksums, correlation, and causation.
- C6 ActiveCampaign access must be bounded, paginated, allowlisted, GET-only, registry-approved, and keyed by stable contact IDs with collision handling. Existing mutation modules remain outside agent tool exposure.
- C7 approval must use a distinct stable Autumn subject, bounded bodies, same-origin/CSRF checks, nonces or decision idempotency keys, payload digests, compare-and-set status/version updates, and durable events. Approval never executes the action.
- C7 triggers must not reuse query-string secrets or treat `x-vercel-cron: 1` as authentication. No Production schedule is activated in this program.

## Increment plan and merge order

| Order | Branch | Intended PR base | Scope | Status |
| ---: | --- | --- | --- | --- |
| 1 | `feature/318-phase-c2-preview-deployment-verification` | `main` | C2 fixes and live isolated Preview verification | Draft PR #326; complete; unmerged |
| 2 | `fix/318-member-surface-correction` | C2 verification branch | Remove invalid PR #325 workflows; implement preview-only tools, explicit public pricing, and field-inspector-first surfaces | Complete locally at `d80bffb`; push/draft PR blocked pending explicit private-repository push approval |
| 3 | `feature/318-c3-durable-staging-workflows` | Corrective branch | Durable Workflow, atomic claims, staging safety, persistence adapter, migrations/tests | Complete locally; live staging application and stacked draft PR externally gated |
| 4 | `feature/318-c4-core-specialist-agents` | C3 branch | Revenue, Growth, Industry, Marketing, Orchestrator v1 contracts/logic | Complete locally; stacked draft PR remains externally gated |
| 5 | `feature/318-c5-orchestrator-operating-review` | C4 branch | `conversion_review`, `daily_business_health`, `weekly_operating_review` | Complete locally; live staging application and stacked draft PR externally gated |
| 6 | `feature/318-c6-sensors-marketing-integrity` | C5 branch | Sensors, SEO/AEO consumption, ActiveCampaign read-only integrity | Complete locally; live staging/parity cycle and stacked draft PR externally gated |
| 7 | `feature/318-c7-admin-approval-surface` | C6 branch | Protected API/admin, owner approval/rejection, triggers, run/status views | Pending |
| 8 | `feature/318-c8-foundation-hardening` | C7 branch | End-to-end trace, unresolved Phase C1 findings, full validation, documentation, parity plan, completion audit | Pending |

Each later draft PR must state that it is stacked on the preceding branch. If an earlier PR merges while work continues, fetch `main`, verify the graph, and safely retarget/rebase without duplicating commits.

## Validation ledger

| Increment | Check | Result | Evidence / classification |
| --- | --- | --- | --- |
| C2 | Isolated protected Preview smoke matrix | Passed | Health 200; invalid synthetic cases 400; authentication 401; persistence 403; fixture 200; no 5xx. |
| C2 | GitHub/Vercel checks at `7e5bd39` | Passed | Final branch clean and all expected contexts green. |
| C2 | Production isolation | Passed with documented boundary event | Project `live:false`; no Production variables/domains; one mistaken Production-target build failed and never became READY. |
| Corrective | PR #325 apply workflow | Failed | Nine runs failed immediately with zero jobs because of a workflow-file issue; no member-surface implementation landed. |
| Corrective | Member-surface contract and Free-to-Pro regression audits | Passed | `npm.cmd run audit:member-surfaces`; `npm.cmd run audit:free-to-pro`. |
| Corrective | ESLint and TypeScript | Passed | `npm.cmd run lint`; `npx.cmd tsc --noEmit`; zero warnings/errors. |
| Corrective | Rendered `/tools` boundary | Passed | Six disabled controls, zero `/tools/*` links, no error overlay; all ten child routes have route-local redirects in addition to middleware. |
| Corrective | Runtime page/API boundary | Passed | `npm.cmd run verify:member-tools-runtime`; all ten child page routes redirect and ten genuinely tool-only API method checks return `503 MEMBER_TOOLS_PREVIEW_ONLY` with `no-store` before side effects. Shared Jobs endpoints remain available to the standalone Jobs experience. |
| Corrective | Rendered public pricing | Passed | Only Free, Pro, Elite, and Agency cards render; Founders and Starter remain absent while legacy entitlement code is retained. |
| Corrective | Rendered homepage positioning | Passed | Field-inspector-first title and role order; mobile notary remains third/adjacent; no functional-tool promises or deep links. |
| Corrective | Browser console/runtime | Passed with environmental observations | Tools, pricing, homepage, and About product truth rendered correctly with no browser errors. Existing logo aspect-ratio warning remains; blocked Google Fonts/Upstash network calls are local sandbox constraints and did not create a page error overlay. |
| Corrective | Isolated Agent Runtime full validation | Passed | Format, pinned dependency smoke, typechecks, 37 tests, migrations, and Preview contracts all pass. |
| C3 | Node and clean dependency install | Passed | Node `v22.22.2`; `npm.cmd ci --ignore-scripts --no-audit --no-fund` installed 521 locked packages. |
| C3 | Full isolated `npm run validate` | Passed | Format, dependency smoke, two TypeScript targets, 41 Node tests, two real Workflow tests, all migration checks, and C2/C3 Preview contracts pass. |
| C3 | Durable duplicate/retry/resume integration | Passed | `@workflow/vitest`: duplicate delivery reuses the same completed run; injected transient persistence failure retries once and reuses completed evaluation output. |
| C3 | New migration static/rollback-safe validation | Passed locally / live staging blocked | SQL shape, sentinel permissions, atomic claims, retry windows, duplicate reuse, completed-step reuse, stale sweep, and transactional rollback script validated statically. |
| C3 | Nitro development compile and HTTP boundary | Passed with browser limitation | Workflow compiler found one workflow/eight steps; C2 health/auth and fail-closed C3 responses passed over HTTP. In-app localhost navigation was blocked by `ERR_BLOCKED_BY_CLIENT`. |
| C3 | Live staging migration and workflow smoke | Blocked pending verified staging binding/credentials | Do not use `apps/web-members/.env.local` or any unverified/production destination. |
| C4 | Core specialist static contract | Passed | `npm.cmd run specialists:check` verifies five implemented typed registrations, deterministic metadata, exact comparison/provenance boundaries, proposal-only Marketing, Orchestrator state persistence/policy/quiet path, and access-status integrity. |
| C4 | Focused deterministic fixtures | Passed | Seven focused tests cover Revenue unknown/authority behavior, four Growth windows, Industry routing, Marketing proposals, Orchestrator ranking/idempotency/quiet behavior; full Node suite is 49/49. |
| C4 | Paid-access `accessStatus` hardening | Passed | A paid tier with directory access but `accessStatus=disabled` now produces `lifecycle.paid_access_mismatch`; prior tier/directory regression remains green. |
| C5 | Real Workflow integration fixtures | Passed | `@workflow/vitest` runs all three exact `phase-c5-v1` workflows; the total Workflow suite is five tests across two files. |
| C5 | Conversion durable trace and duplicate delivery | Passed | One fixture persists the expected correlated signal/recommendation/task/experiment/proposed-action/review counts, verifies the readback, and reuses the completed run on duplicate delivery. |
| C5 | Daily health quiet contract | Passed | The healthy fixture persists one quiet review with no notification, signals, priorities, Autumn decisions, or actions. |
| C5 | Weekly review bounds | Passed | The fixture invokes Revenue, Growth, Industry, and Marketing, suppresses duplicate operational work, and emits no more than three priorities, decisions, or proposed actions. |
| C5 | Migration and permission contract | Passed locally / live staging blocked | Static checks and rollback-safe SQL cover service-role-only functions, SELECT-only direct access, bounded atomic batches, idempotency mismatch rejection, proposed-only actions, and duplicate stable counts. |
| C5 | Full isolated `npm run validate` | Passed | Format and dependency checks, both TypeScript targets, 49 Node tests, five real Workflow tests across two files, all Phase B/C1/C3/C5 migration checks, C2 Preview checks, and C4 specialist checks pass. |
| C6 | Existing-report compatibility and provenance | Passed | Checked-in SEO/AEO/content report shapes normalize without collector changes; their June 2026 data is explicitly stale baseline evidence, not live observation. |
| C6 | Durable weekly sensor consumption | Passed | The sixth Workflow fixture directly supplies live SEO/AEO reports, persists normalized observations before operating artifacts, consumes their signals, and reuses every record on duplicate delivery. |
| C6 | ActiveCampaign read-only integrity | Passed | Focused fixtures prove exact-host and stable-ID allowlisting, bounded GET-only pagination, all seven classifications, all twelve required lifecycle/engagement cases, email-free outputs, marketing-only authority, proposal-only actions, and idempotent sensor-batch persistence. |
| C6 | Stable contact authority and approval-preserving inventory | Passed | ActiveCampaign membership context joins by stored contact ID rather than email, collisions are withheld, and recurring inventory uses an RPC that preserves owner review/read state while direct service-role asset writes are revoked. |
| C6 | Migration and permission contract | Passed locally / live staging blocked | Static and rollback-safe SQL cover null/bound checks, duplicate reuse, changed-payload rejection, SELECT-only runtime tables, normalized sensor events, and approval-preserving asset refresh. |
| C6 | Full isolated `npm run validate` | Passed | Format and dependency checks, both TypeScript targets, 55 Node tests, six real Workflow tests across two files, all Phase B/C1/C3/C5/C6 migration checks, C2 Preview checks, and C4 specialist checks pass. |

## External blockers and Autumn-controlled decisions

1. The dedicated Supabase staging project exists, but this checkout has no staging project reference, server-only secret/service-role credential, or approved destination fingerprint. C3 must fail closed and complete fixture/static testing; live staging application remains blocked until Autumn supplies the reviewed nonsecret project reference and a secret through the approved environment channel.
2. Production migration, Production Vercel variables, Production scheduling, Production deployment/promotion, and the Agent Runtime Production Branch change remain explicit Autumn rollout actions.
3. No OpenAI key is available or required. Model execution remains disabled by default; deterministic agents and test doubles are the foundation acceptance path.
4. PR #324 must remain open until the focused replacement is implemented, verified, and merged. Then Autumn may close it as superseded; never reuse its commits.
5. Existing reports and scheduled collectors remain active until one successful parity cycle is recorded.

## Corrective member-surface acceptance checklist

- [x] Remove the two invalid one-shot PR #325 workflows that failed on every push.
- [x] Make `/tools` a non-functional, field-inspector-first preview for every audience.
- [x] Redirect every `/tools/*` execution route back to the preview boundary.
- [x] Add route-local redirects so child pages cannot ship their legacy direct-Supabase or client execution modules even if middleware changes.
- [x] Deny tool-only AI, weather, and company-tracker APIs with a committed server-side 503/no-store guard.
- [x] Preserve shared Jobs endpoints and the standalone Jobs pipeline instead of applying the `/tools` kill switch to unrelated consumers.
- [x] Remove disabled tool routes from the public sitemap.
- [x] Replace homepage, About, legal/support, legacy-plan, public, role, resource-center, and member-dashboard execution promises/deep links with current-state or preview-only copy.
- [x] Render public pricing through an explicit Free/Pro/Elite/Agency UID allowlist.
- [x] Remove checkout claims that sell currently executable member tools; keep prices and entitlement recognition unchanged.
- [x] Preserve Founders and Starter in legacy entitlement checks.
- [x] Keep mobile notary as an adjacent role rather than removing the segment.
- [x] Add focused static and runtime CI contracts and run lint, TypeScript, existing funnel regression, and browser checks.
- [ ] Commit, push, and open a stacked draft PR based on the C2 verification branch. Do not merge.

## Unresolved merged-code hardening ledger

These findings were verified against current `main` on 2026-08-26 and remain required Issue #318 work:

| Priority | Finding | Current evidence | Responsible increment |
| --- | --- | --- | --- |
| P1 | One anonymous identity can be attributed to multiple profiles in input-order-dependent fashion | `apps/agent-runtime/src/projections/member-projection.ts` overwrites the anonymous-ID map when more than one profile claims the ID | C8 at the latest; move earlier if touched by C3/C4 |
| P2 | Stale identity links are never revoked | `apps/agent-runtime/src/persistence/projection-store.ts` only upserts current links | C8 at the latest; include in projection batch hardening if C3 touches the store |
| P2 | Recurring asset audits reset owner approval | Resolved locally in C6: recurring refresh calls an approval-preserving RPC, and direct service-role registry writes are revoked | C6 commit review/merge |
| P2 | ActiveCampaign contact authority was joined by email despite a stored contact ID | Resolved locally in C6: active contact-ID identity links are authoritative; collision links are withheld and email equality grants no authority | C6 commit review/merge |
| P2 | Paid-access integrity ignored disabled/inactive `accessStatus` | Resolved locally in C4: tier, directory access, and recognized enabled status must all agree; focused regression passes | C4 commit review/merge |

The paid-access, ActiveCampaign contact-ID, and approval-preserving inventory findings above are resolved locally; they remain listed until their stacked commits are reviewed and merged.

## Current C6 acceptance checklist

- [x] Preserve the existing SEO, AEO, content-brief, conversion, and Adzuna collectors and document their target sensor contracts.
- [x] Accept existing SEO/AEO/content report shapes with explicit live/baseline/fixture provenance, stable references, checksums, health, staleness, correlation, and causation.
- [x] Remove the weekly workflow's build-time JSON dependency by accepting report objects directly in the same invocation.
- [x] Persist bounded sensor runs and observations idempotently before weekly operating artifacts; reuse identical deliveries and reject changed payloads under reused keys.
- [x] Route SEO/AEO signals into weekly review while retaining the three-priority and three-Autumn-decision bounds.
- [x] Keep content briefs unpublished, mutation-disabled candidate actions and Adzuna as the existing opportunity source.
- [x] Implement the bounded GET-only ActiveCampaign client with an owner-reviewed hostname and stable resource-ID allowlist.
- [x] Emit email-free stable-ID classifications, marketing metrics, all required lifecycle/engagement signals, and proposal-only cleanup actions without membership/revenue authority.
- [x] Join ActiveCampaign context by stored contact ID, withhold collision links, and remove email-based authority.
- [x] Preserve owner asset approvals during recurring inventory refresh and revoke direct runtime writes to the registry.
- [x] Add migration, rollback-safe validation, deterministic fixtures, compatibility/parity documentation, and focused static checks.
- [x] Pass both TypeScript targets, 55 Node tests, six real Workflow tests, and all Phase B/C1/C3/C5/C6 migration checks.
- [x] Keep credentials, external calls, schedules, triggers, migrations, mutations, Production variables, and Production deployment disabled.
- [ ] Push and open a stacked draft PR without merging; blocked pending explicit private-repository push approval.
- [ ] Apply migrations and complete one parity cycle in reviewed staging; blocked pending Autumn's C3 binding, credential, migration authorization, and the C7 protected trigger.

## Current C5 acceptance checklist

- [x] Implement the exact stable Workflow names `conversion_review`, `daily_business_health`, and `weekly_operating_review` at `phase-c5-v1`.
- [x] Reuse C3 atomic run/step claims, retries, completed-step reuse, destination binding, readback verification, and durable completion/failure records.
- [x] Invoke the required C4 specialists with persisted metrics, signals, experiments, open tasks, prior actions, and Orchestrator state.
- [x] Persist bounded signals, recommendations, tasks, experiments, proposed actions, reviews, priorities, Autumn decisions, evidence, correlation, and causation transactionally.
- [x] Reject changed state or artifact payloads under reused idempotency keys.
- [x] Keep actions approval-required and executor-free, with `mutationAllowed=false` and no execution timestamps.
- [x] Prove healthy daily quiet behavior and weekly three-priority/three-decision bounds.
- [x] Preserve the C6 seam for durable live/baseline-provenanced SEO/AEO observations.
- [x] Keep schedules, public triggers, notifications, model calls, external mutations, Production configuration, and Production deployment out of scope.
- [x] Run focused Workflow, Node, TypeScript, format, migration, and static acceptance checks.
- [ ] Push and open a stacked draft PR without merging; blocked pending explicit private-repository push approval.
- [ ] Apply and smoke-test against the reviewed staging destination; blocked pending Autumn's C3 binding, credential, and migration authorization.

## C4 acceptance checklist

- [x] Implement Revenue Agent v1 against normalized metrics with defensible deltas and unknown preservation.
- [x] Keep ActiveCampaign outside financial and paid-status authority.
- [x] Implement Growth Agent v1 current/prior week and trailing 4/12-week comparisons across required metric families.
- [x] Produce deterministic structured anomalies and durable signals; use Revenue output for financial truth.
- [x] Implement Industry Intelligence Agent v1 with publication/event dates, provenance, confidence, relevance, segment, risk, licensing caveat, and follow-up.
- [x] Keep live research behind an explicitly approved read-only tool gate; use deterministic fixtures for acceptance.
- [x] Implement Marketing Agent v1 consuming Revenue/Growth with recommendations, experiments, identifier-free audiences, internal copy, and proposed actions only.
- [x] Implement Operations Orchestrator v1 typed invocation, persisted-state inputs, evidence ranking, tasks/experiments/actions, action-policy enforcement, bounded Autumn decisions, and quiet path.
- [x] Persist bounded Orchestrator operational state through an idempotent testable store port.
- [x] Keep model execution disabled, token/cost null, mutations false, and private reasoning absent.
- [x] Resolve inactive paid-access integrity and add regression coverage.
- [x] Run focused static, TypeScript, and 49-test Node acceptance checks.
- [ ] Push and open a stacked draft PR without merging; blocked pending explicit private-repository push approval.

## Current C3 acceptance checklist

- [x] Install and lock the current Workflow DevKit without adding Vercel Queues.
- [x] Add a real `"use workflow"` orchestration entry point and bounded `"use step"` functions.
- [x] Add atomic, idempotent run/step claims that reuse completed work and never reset a completed run.
- [x] Persist start/completion/failure/retry/heartbeat/stale/verification state, correlation/causation, tool summaries, and optional usage/cost.
- [x] Add duplicate-delivery and resume-safe tests.
- [x] Add a committed deny-by-default staging destination binding that rejects the known production project and unreviewed hosts.
- [x] Keep secrets server-only and absent from logs/responses/tests/docs/Git.
- [x] Add bounded/batch persistence APIs and tests that avoid request-time serial write chains.
- [x] Add a focused migration plus rollback-safe validation/operator instructions.
- [x] Run Node version, `npm ci`, full `npm run validate`, focused tests, and `git diff --check`.
- [x] Review the local C3 diff against corrective base `d80bffb` and resolve findings.
- [ ] Push and open a stacked draft PR without merging; blocked pending explicit private-repository push approval.
- [ ] Apply and smoke-test against the reviewed staging destination; blocked pending Autumn's staging reference, sentinel approval, credential, and migration authorization.

# Issue #318 acceptance resume evidence

> **Superseded for current status on 2026-09-03.** This remains the authoritative dated evidence record for the synthetic Preview/staging acceptance described below. Current program status, decisions, priorities, and handoff live only in the [canonical execution ledger](issue-318-foundation-execution-ledger.md).

Checked through 2026-09-03 ET. Issue #318 remains open. This is an acceptance checkpoint, not a Production launch or a completed same-cycle SEO/AEO parity claim.

## Live synthetic staging acceptance: 2026-09-03 ET

The owner signed in through the normal Outseta flow and used the protected Members Preview at `/admin/intelligence-os`. The page rendered the owner-only workflow, evidence, and decision controls. The previously observed signed-out branch-alias request redirected to hosted login and exposed no owner controls. An authenticated non-owner account was not available, so that negative role check remains unexercised live.

The first synthetic conversion trigger exposed a real deployment defect. Vercel Workflow run `wrun_01M1M6WHH11TE1EENDEETZB7RS` failed in `claimOperatingRunStep` with `ERR_MODULE_NOT_FOUND` for `@supabase/supabase-js`. It failed before an application workflow run was persisted; one signed trigger nonce may have been consumed. This attempt is classified as failed, not accepted.

The seven runtime stores now use traceable literal lazy imports rather than `import(packageName)`, and the dependency smoke test rejects a return to the untraceable form. Commit `1bc22473208148f7344e6ab126e377cf8d2f2b78` is pushed only to `codex/318-staging-acceptance`.

| Refreshed project | Deployment | URL | Target / status |
| --- | --- | --- | --- |
| Runtime | `dpl_HRNwS4H1uYgwhgw4SQa9PqFxfx8Q` | `https://nested-objects-agent-runtime-2yxzu78co.vercel.app` | Preview / READY / `1bc2247` |
| Members | `dpl_3eTUifAArGhxqExog7xmkhCDSqb6` | `https://nested-objects-starter-obvfbf5yq-autumns-projects-246e052c.vercel.app` | Preview / READY / `1bc2247` |

The Runtime output retained ten distinct Node 22 functions. The Workflow step grew from 3,438,287 to 4,068,993 bytes, consistent with bundling the missing dependency. Exact-deployment health succeeded. An unauthenticated exact-deployment request to `/api/admin/snapshot` returned `401 ADMIN_SERVICE_AUTHENTICATION_FAILED`. A cookie-free Members exact-deployment request was intercepted by Vercel SSO before reaching the application, so it is not counted as an application authorization result.

### Durable workflow and duplicate-run evidence

All accepted runs used synthetic staging inputs dated 2026-09-03, with model execution and external mutations disabled.

| Workflow / trigger | Correlation ID | Durable application run | Business idempotency key | Result |
| --- | --- | --- | --- | --- |
| Manual `conversion_review` | `9d5fca87-beb4-5ded-a76e-94ca4687ae3c` | `fb1ef4d5-19ec-4051-a090-bcfab1dd3818` | `phase-c5:conversion_review:synthetic-conversion:2026-09-03` | succeeded / verified / quiet |
| `daily_business_health` | `c047fc0f-293d-5086-b97e-7ef056761692` | `57a85cf4-0499-4cc1-8879-98fcd134a4c2` | `phase-c5:daily_business_health:synthetic-daily:2026-09-03` | succeeded / verified / quiet |
| `weekly_operating_review` | `5b53673e-4ec3-52be-8acd-538651099a0b` | `5cf564c2-e7f4-4c74-9a90-92f2c2a6302d` | `phase-c5:weekly_operating_review:synthetic-weekly:2026-09-03` | succeeded / verified / quiet |
| Critical integration failure event | `4b7cedb9-56b0-5eea-aa33-a1ebccaaf0b9` | `00f48de3-53bd-45b3-9f69-6977857dc3ef` | `phase-c5:conversion_review:synthetic-event-review:2026-09-03:001` | succeeded / verified / completed |

The event used source key `synthetic-event:issue318:2026-09-03:v1:integration-failure`, signal `9e450c88-9515-59e9-8e53-5500dae57947`, and produced one high P90 priority, one Autumn decision, one task, and one recommendation. The deterministic workflow produced no proposed external action.

Submitting the same event business key again through a fresh owner form generated a second `trigger.event.conversion_review` request but reused the same durable application run. Database readback returned request count `2` and business-key run count `1`. This proves deployed business-level duplicate protection with fresh service nonces. It does **not** prove exact replay of one signed nonce; that remains covered locally and would require a separately reviewed server-side live method.

### Owner decisions and correlation trail

After the successful event run, the guarded staging operation [20260903_seed_issue318_acceptance_proposals.sql](../../supabase/operations/20260903_seed_issue318_acceptance_proposals.sql) inserted exactly two `synthetic_noop` proposed actions. The operation is exact-run, exact-signal, exact-correlation, insert-only, overwrite-resistant, namespace-bounded, and explicitly sets `externalMutationAllowed=false`. It changes no schema, privilege, owner, destination binding, executor, model, email, or external system.

| Decision | Action ID | Payload digest | Durable result |
| --- | --- | --- | --- |
| Approved | `31800000-0000-4000-8000-202609030001` | `5633dc65e36289d3d7da2392291ad26e405e6f8d6f53b905cbcf6544fad4f790` | `approved`, version 1, owner `9P66YMPm`, approved payload matched, execution not started |
| Rejected | `31800000-0000-4000-8000-202609030002` | `1679a6ff91727d86cee446b3be27273af6c57041cde392d8f734fde9014e08f6` | `rejected`, version 1, owner `9P66YMPm`, no approved payload, execution not started |

The owner UI reported `Action approved. No execution was started.` and `Action rejected. No execution was started.` Awaiting-review count returned to zero. Readback found four action audit events—awaiting plus final state for each fixture—one `action.approved:1` nonce and one `action.rejected:1` nonce, with correlation and causation retained. Both actions have null executor, execution-start, executed-at, and execution-result fields. Outcomes, measurements, and learnings remain zero.

The event correlation returned seven checksum-bearing trace links: two `action_has_approval_state` links plus `evidence_supported_recommendation`, `observation_produced_signal`, `signal_created_investigation`, `signal_supported_recommendation`, and `workflow_persisted_artifact`. Every link matched the event correlation, and both actions directly retained the run, signal, correlation, and causation references.

### Operating-review comparison and validation classification

Database comparison found four succeeded and verified reviews, each with exactly one `agent.operating_review.persisted` event. The three manual/daily/weekly baseline runs were quiet with zero priorities, decisions, and material artifacts. The event run had one priority, one decision, one task, one recommendation, and seven trace links. The observed maximum priority count was one, so the maximum-three bound held.

This is a completed **synthetic operating-review comparison**, not a same-window SEO/AEO parity cycle. The checked-in historical SEO/AEO reports still provide deterministic compatibility evidence—SEO 5 observations and AEO 12, with truthful stale-source warnings—but no new report snapshot was persisted.

Fresh post-fix source checks passed 25/25 tests: 19 Runtime admin/durability/trace/specialist tests and six Members transport tests. The protected-admin static audit, dependency, typecheck, migration, Preview, format, and diff checks also passed. The `test:workflow` wrapper could not traverse the isolated Windows junction and stopped before tests; this is recorded as an unavailable harness, not a product-test pass or failure. No production build was run.

No Production deployment, promotion, migration, variable, schedule, model call, real-member write/export, email, marketing mutation, external execution, merge, or cleanup occurred. The bounded synthetic rows remain in staging so the evidence is reviewable; removing them requires separate approval.

## Prior approved-continuation checkpoint: 2026-09-03 ET

The subsection below records the verified state immediately before the live synthetic sequence. The live evidence above supersedes its pending/empty-queue statements.

Autumn approved refreshing the isolated Preview and synthetic-only staging acceptance writes after configuration verification. No approval was given for Production changes, real-member data, model execution, external actions, non-synthetic report persistence, or cleanup.

The acceptance branch alone was fast-forwarded from `0fe1346` to already merged `44f37b1`. Git readback confirms main remains `44f37b1` and `deploy/agent-runtime-production-disabled` remains `1ace8ec942044493e3e4e1e0cd5dee0c4081c8bc`. No merge, Production push, or promotion occurred; the shared dirty checkout remains unchanged.

| Refreshed project | Deployment | URL | Target / status |
| --- | --- | --- | --- |
| Runtime | `dpl_EmCiEmyurq3xf8eDptG444a5gV74` | `https://nested-objects-agent-runtime-jsl2r4hnk.vercel.app` | Preview / READY |
| Members | `dpl_DgE1Y3jTnDJme31woveT71W2ngXf` | `https://nested-objects-starter-5f1odfmde-autumns-projects-246e052c.vercel.app` | Preview / READY |

Both use SHA `44f37b1` on `codex/318-staging-acceptance`; the Members login-handoff repair is now included. Their prior branch aliases remain the configured acceptance origins.

Authenticated Vercel CLI `/api/health` returned:

```json
{"ok":true,"configurationValid":true,"environment":"preview","mode":"dry_run","persistenceEnabled":true,"modelExecutionEnabled":false,"mutationsEnabled":false,"workflowProvider":"vercel_workflow","tokenConfigured":true,"supabaseConfigured":true,"destinationReviewed":true,"databaseSentinelVerified":false,"vercelEnvironment":"preview"}
```

The public Members Supabase URL was individually verified as `https://wqstirwszdbsygstnvbn.supabase.co`. Runtime project inspection confirms zero Production variables, deployment protection enabled, and the intentionally disabled Production branch. A bulk decrypted-variable read was blocked by automatic safety review; the safer metadata-only request succeeded. Sensitive entries return no retrievable value even through the individual endpoint. No secret was printed, exported, rotated, reclassified, or written to a file. Local ignored `.vercel/project.json` contains only verified project/team identifiers for authenticated CLI health access.

The Supabase dashboard positively identifies `nested-objects-staging`, ref `wqstirwszdbsygstnvbn`, Healthy. A new query, explicitly wrapped in `BEGIN READ ONLY`, checked the existing owner/destination guards and returned:

```json
{"ownerCount":1,"bindingCount":1,"ownerMatches":true,"todayUiFixtureRuns":0,"destinationVerified":true,"acceptanceNamespaceRuns":0}
```

This proves the inspected database binding/owner, not that the Runtime's deployed credential has successfully read it. That protected transport read remains part of owner-page acceptance.

The hosted Outseta page supports `configureFromQuerystring`; its public script accepts `authenticationCallbackUrl`. A normal login tab now returns to the Members acceptance alias `/admin/intelligence-os`, without changing global provider settings or copying a session. Awaiting Autumn's sign-in. The [Outseta staging guidance](https://go.outseta.com/support/kb/articles/xmeyJRmV/localdev-test-and-staging-environment) documents per-environment callback overrides.

No Queue/Approve/Reject operation has been submitted, and no synthetic workflow/action/nonce/audit row has been written during this continuation. [The proposal seed](../../supabase/operations/20260903_seed_issue318_acceptance_proposals.sql) is prepared only, requires the verified synthetic event run first, and does not alter owners, destination bindings, privileges, or schema. Existing fixtures produce no proposed actions; an empty approval queue is not an approval-test pass.

Use the real owner surface next. Its trigger forms generate fixed date-based synthetic business keys; record those actual keys, and set the visible event source key to `synthetic-event:issue318:2026-09-03:v1:integration-failure`. A normal UI re-submit creates a fresh service nonce and proves business deduplication/CAS only. Do not label it an exact signed-request replay test. Exact signed replay and stale-payload transport checks remain pending unless exercised through a separately reviewed server-side path that keeps secrets inside the deployment.

The earlier sections below remain the history of the reconciliation pass, not current deployment status.

## Scope and ownership

This task owns owner-only Intelligence OS review, evidence/correlation, duplicate-run protection, and operating-review comparison. The inspector-acquisition task owns conversion storage, signup-to-payment review, and PR #342 follow-up. No conversion code, analytics schema, marketing automation, or acquisition review was changed here.

Evidence documentation is isolated on `codex/318-acceptance-resume`, based on fetched main `44f37b1c0bae18f4e9eb9c64ead3abc504a78ac5`. The shared checkout remains on `codex/free-directory-offer-clarity` at `696d3075f1f7032d0093ecb5f9ab257075285f12`, with its pre-existing dirty files preserved. No commit, push, PR, merge, or deployment was made in this resume.

## Reconciled completed work

The prior execution-ledger checkpoint records these completed operations, which were **not rerun**:

- C3-C8 migrations and repaired C8 SHA-256 decision-trace validation on `nested-objects-staging` (`wqstirwszdbsygstnvbn`).
- C3/C5/C6/C7/C8 rollback validations; synthetic rows removed by their original transactions.
- Explicitly confirmed owner subject `9P66YMPm`, sole-owner registration, and reviewed staging destination binding.
- Branch-scoped Runtime durability/owner configuration and Members staging/marketing isolation.

GitHub now confirms PR #334 merged on 2026-09-02 at `edbe2c99646ca18af06ad9636f0e8e45da9556b1`. Do not treat the old draft stack table as current. Do not rerun the synthetic-owner SQL validation against an activated real-owner registry or remove the owner to make old fixtures pass.

## Repository and local verification

The acceptance Runtime and owner page/helper code have no diff between acceptance branch `0fe13467f4dd26ac11f1eed13763abc04f97ff6f` and fetched main. Members login routing is different: the acceptance branch lacks the merged PR #336 repair in middleware, `/api/auth/complete`, `/auth/callback`, and redirect validation.

| Check | Result | What this does not prove |
| --- | --- | --- |
| Owner authorization, signed requests, nonce replay, stale version/payload checks, approval without execution | 5/5 local Runtime tests | Deployed owner session and durable decision writes |
| Destination guards, duplicate-run reuse, retry/resume | 5/5 local Runtime tests | Actual repeated delivery through deployed staging |
| Evidence/outcome/measurement/learning links and immutability | 2/2 local Runtime tests | Actual staging trace readback |
| Specialist authority, metric comparisons, proposal-only output, quiet behavior, three-priority cap | 7/7 local Runtime tests | Current business results or legacy-report parity |
| Real Workflow directives and synthetic persistence adapters | 7/7 across two test files | Live Supabase writes; the tests use in-memory adapters |
| Members transport and staging marketing isolation | 5/5 mocked tests | Authenticated browser execution |
| Protected-admin static audit | Pass | Runtime execution of every source-fragment invariant |

Total: **31 passing tests plus one static audit**, without a production build. Existing earlier full-suite/typecheck results remain historical, not rerun results. No numerical coverage claim is made.

Runtime `npm test` invokes build/clean, and `test:workflow` invokes clean. Those wrappers were not used. With `dist/index.js` absent, unchanged Node tests ran against current TypeScript through this process-local source resolver, from `apps/agent-runtime`:

```powershell
$acceptanceRunner = @'
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
const appRoot = pathToFileURL(process.cwd() + '/').href;
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === '../dist/index.js' && context.parentURL?.startsWith(appRoot + 'test/')) {
    return nextResolve(appRoot + 'src/index.ts', context);
  }
  if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL?.startsWith(appRoot + 'src/')) {
    return nextResolve(new URL(specifier.slice(0, -3) + '.ts', context.parentURL).href, context);
  }
  return nextResolve(specifier, context);
}});
for (const suite of ['admin-surface', 'durable-workflow', 'learning-trace', 'core-specialists']) {
  await import(appRoot + 'test/' + suite + '.test.mjs');
}
'@
node --experimental-transform-types --input-type=module -e $acceptanceRunner
.\node_modules\.bin\vitest.cmd run --config vitest.workflow.config.ts
```

Workflow startup first failed inside the Windows filesystem sandbox before executing tests. The identical direct Vitest command passed outside it: two files, seven tests, 47.57 seconds. Only ignored test artifacts were generated; no clean/install/config changes were made.

From `apps/web-members`:

```powershell
node --test tests/intelligence-os-transport.test.mjs
npm.cmd run audit:intelligence-os-admin
```

All transport environment values and fetch responses were injected synthetic mocks. No live environment files were loaded for these tests.

## Actual baseline comparison (not a fresh parity cycle)

The pure existing-report adapters were also exercised against the real checked-in `apps/web-members/content/seo-content-opportunities.json` and `ai-aeo-opportunities.json`, using `provenanceMode=baseline` and a fixed observation time of `2026-09-02T00:00:00.000Z`. No collector or durable workflow was invoked.

| Baseline | Generated at (UTC) | Candidates to observations | Opportunity / stale-source signals | Proposed actions |
| --- | --- | --- | --- | --- |
| SEO | 2026-06-15T00:23:12.974Z | 5 to 5 | 5 / 4 | 0 |
| AEO | 2026-06-15T00:23:09.021Z | 12 to 12 | 12 / 2 | 0 |

Both batches correctly report stale at the default 216-hour freshness threshold. Every candidate ID remains a unique source-record reference. Original timestamps, baseline provenance, and report/observation SHA-256 checksums survive normalization. Identical repeated input yields deeply identical output.

Upstream input counts are preserved separately from opportunity counts: SEO GSC 20, GA4 4, PageSpeed 2, blog registry 3; AEO 18 prompts and 18 answer snapshots. The latter are not 18 opportunity candidates, so 12 AEO observations is the correct comparison.

| Artifact | Raw file SHA-256 (tested shared checkout) | Canonical normalized batch checksum |
| --- | --- | --- |
| SEO | `f6dd3dca7a697b08e39d641dd9c74774a228a5c1716cead938af6265b4f26b3c` | `a378acf3dfe9f34e97fac638f55936994b68e923b048f8620e5c1e55107b9ae7` |
| AEO | `c5a1a5871a62c968510cb6e4cce7b6587759f61e7c744bfc4e352980bc7bf40b` | `1db0c6d3f0f2f51c9ebd749118db9f2ed8cfea3c5b77eeed2654e704ade8e744` |

Raw file hashes vary with checkout line endings; the isolated Windows worktree uses different raw bytes but parsed JSON is identical. Use canonical normalized checksums for semantic comparison. This verifies compatibility with actual legacy files and truthful staleness, not current data collection, durable storage, or one completed operating-review comparison. The baseline files and collectors are unchanged.

## Platform and browser observations

Both acceptance deployments are READY, Preview target, branch `codex/318-staging-acceptance`, SHA `0fe1346`:

| Project | Deployment | Branch alias |
| --- | --- | --- |
| Runtime | `dpl_3PAavMk9ZdfqC1LEJd3pMn5wi3pg` | `nested-objects-agent-runti-git-ac961a-autumns-projects-246e052c.vercel.app` |
| Members | `dpl_A8RfrdxWH1hZur5eEbkYiicetGxd` | `nested-objects-starter-git-cod-21e6a4-autumns-projects-246e052c.vercel.app` |

Vercel environment settings visibly confirm:

- Runtime Production branch: `deploy/agent-runtime-production-disabled`.
- Members Production branch: `main`; unassigned branches use Preview.
- Runtime durability/admin/Supabase variable names are scoped to the acceptance branch. Members admin/transport/Supabase overrides are also scoped to that branch.

Only variable names/scopes were inspected. Effective secret values, origin equality, destination identity, active flag values, and database sentinel were not independently verified in this resume. Scope presence must not be reported as successful value validation.

Signed-out navigation to the Members alias `/admin/intelligence-os` redirected to hosted Outseta login and rendered no owner controls. No credentials were entered and no Queue/Approve/Reject control was used. This proves the observed signed-out redirect, not authenticated non-owner rejection or successful owner access.

The Runtime health connector returned a platform 302; direct and branch-alias browser navigation returned `ERR_BLOCKED_BY_CLIENT`. The handler was not reached, so health/configuration results are **unknown**, not failed application checks. Protection was not disabled.

Fresh owner login acceptance must use a Preview containing the already merged login-handoff repair. Do not test the stale Preview and report its behavior as the repaired application, or modify Production authentication to work around Preview access.

## Read versus write boundary

Owner page rendering, signed snapshot GET, signed run-detail GET, and owner-checked `get_agent_correlation_trace` are read-only in the inspected implementation. Form tokens/signatures are generated in memory; these reads do not consume a database nonce.

Queue actions consume a nonce, write an authorization event, and start a durable workflow. Both approve **and reject** consume a nonce, update an action, and persist audit/trace records. `executionStarted=false` and `mutationAllowed=false` prohibit external execution; they do not make those staging writes read-only.

The minimal page exposes evidence, payload digest/version, warnings, review summaries, and correlation IDs. It does not link to a complete trace browser. Full linkage can be accepted using owner-checked run/SQL readback without adding a larger UI, consistent with the issue's minimal-admin requirement.

## Remaining acceptance, in order

1. Exercise authenticated non-owner rejection when a suitable non-owner account is available. The owner and signed-out paths are proven; do not weaken the guard to manufacture this check.
2. If live transport proof beyond the business-key replay is required, separately review and authorize a server-side method for exact signed-nonce replay, stale decision version, changed payload digest, and repeated decision submission. Local and rollback-safe SQL tests already cover these cases; normal UI resubmission is not equivalent.
3. After a reviewed non-PII report snapshot and its staging persistence are separately approved, compare one same-cycle legacy/report input: generated timestamps, source counts, canonical checksums, stable references, freshness/health, findings, omissions/additions, evidence links, and no more than three priorities. Keep the acquisition-owned conversion interface and all existing collectors/reports intact.
4. Record Autumn's acceptance decision. Issue #318 remains open until Autumn closes it. Any synthetic cleanup, collector retirement, Production migration, variable, schedule, deployment, promotion, or executor remains separately gated.

No Production database, real-member export, model call, email, marketing mutation, external executor, or new schedule is authorized by this checkpoint. Do not lift the current database-write hold merely because prior migrations were approved.

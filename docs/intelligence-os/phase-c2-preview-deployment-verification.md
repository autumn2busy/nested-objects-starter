# Issue #318 Phase C2 Preview Deployment Verification

Date: 2026-08-26

Status: COMPLETE for the isolated Vercel Preview deployment and live HTTP verification. No Production deployment reached `READY` or became live; one failed Production-target attempt is recorded below. Pull request #326 remains draft, and Issue #318 remains open.

## Scope and exact revisions

- Repository: `autumn2busy/nested-objects-starter`
- Verified `main` baseline: `7e1eab8100b80f42c274816fbb7bf254edaa7545`
- Merged Phase C2 baseline: `f5cba5e36df902b17f13a7ca3764ee5f6fea0802`
- Verification branch: `feature/318-phase-c2-preview-deployment-verification`
- Draft pull request: <https://github.com/autumn2busy/nested-objects-starter/pull/326>
- Restored configuration-error guard: `de8ddeed8220376b4e465fa4709585b0416f9017`
- Runtime and packaging revision tested live: `4ca7f8648da014edd375fb85b7ede2c415595c43`
- Original Phase C2 feature branch: deleted after merge

The deleted-branch fallback in the original handoff pointed to the merged Phase C2 commit. That tree contains a known response-mapping regression: a malformed base runtime contract can return a generic HTTP 500 instead of the documented sanitized HTTP 503. The verification branch intentionally restores the reviewed configuration guard and compiled-handler regression test before deployment. This is a focused safety correction, not an attempt to expand Phase C2.

Three packaging corrections were also required to make the reviewed API handlers deployable as Vercel Functions:

1. `4cd7d882d45660db2e6c19a9576fb27ad8bd29be` constrains Node.js to `>=22.16.0 <23` so the Vercel 22.x project setting cannot be overridden by Node 24.
2. `cbae253a33d486d644ad7d81fd9e9bddb4f0dd5f` declares the controlled `public` output directory and adds only a deny-all `robots.txt`; compiled runtime modules are not published as static assets.
3. `4ca7f8648da014edd375fb85b7ede2c415595c43` removes the restrictive root `rootDir` from `tsconfig.json`. Vercel can inject both API entry points into its TypeScript program while the normal package build continues to infer `src` and preserve the existing `dist` layout.

## Verified Vercel project

```text
Team: Autumn's projects (autumns-projects-246e052c)
Project: nested-objects-agent-runtime
Project ID: prj_Qofq8LTeDd3Kyiv7T2rbx6xoN3qA
Repository: autumn2busy/nested-objects-starter
Root Directory: apps/agent-runtime
Framework: Other
Node.js setting: 22.x
Production Branch: deploy/agent-runtime-production-disabled
Ignored Build Step: Automatic
Custom Production Domain assignment: disabled
Production environment variables: none
Custom or existing domains added or moved: none
```

After the live tests, Vercel still reported `live: false` and `domains: []`. The successful deployment has a generated `.vercel.app` URL and a generated feature-branch alias; neither is a custom-domain attachment or a Production promotion.

The configured Production Branch remains pinned to the reviewed Phase C1 baseline at `1ace8ec942044493e3e4e1e0cd5dee0c4081c8bc` (pull request #322). It is 0 commits ahead and 58 commits behind the verified `main`; it is an ancestor of the Phase C2 merge, while `f5cba5e36df902b17f13a7ca3764ee5f6fea0802` is not its ancestor. The disabled branch therefore contains neither the Phase C2 API/runtime entry point nor the later member-application changes.

### Preview and Development variables

The project contains exactly these ten logical keys for Preview and Development. The bearer value is hidden and is stored in the appropriate Preview and Development scopes; it is not recorded here.

```text
AGENT_RUNTIME_ENV=preview
AGENT_RUNTIME_MODE=dry_run
AGENT_MUTATIONS_ENABLED=false
AGENT_MODEL_EXECUTION_ENABLED=false
AGENT_WORKFLOW_PROVIDER=in_memory
AGENT_RUNTIME_VERSION=phase-c2-v1
AGENT_TRACE_NAMESPACE=nested-objects-intelligence-os
AGENT_PREVIEW_API_TOKEN=<hidden secure random value>
AGENT_PREVIEW_SYNTHETIC_ONLY=true
AGENT_PREVIEW_PERSISTENCE_ENABLED=false
```

`VERCEL_ENV` is platform-provided and was not configured manually. Production was filtered separately and showed no user-configured variables. A second unfiltered audit found no Supabase, OpenAI, ActiveCampaign, Outseta, Stripe, staging-project, production-member, or production-contact credential names.

## Deployment history and boundary event

Four isolated Agent Runtime deployments exist:

| Deployment | Source commit | Target | Result | Evidence |
| --- | --- | --- | --- | --- |
| `dpl_CHvHuzSCDqRFwKuHw5yPgLLoLqHL` | `980c0ca849a6808f6787017ec879612221c25580` | Production | ERROR | The Dashboard control labeled **Create Preview Deployment** unexpectedly staged a Production-target deployment. It failed before serving with `STATIC_BUILD_NO_OUT_DIR`; it is not a rollback candidate and never made the project live. |
| `dpl_6Tj5U6N3hPnUJuqmHAbWMVYZBv6K` | `4cd7d882d45660db2e6c19a9576fb27ad8bd29be` | Preview | ERROR | Package compilation passed, then static output validation expected `public`. |
| `dpl_3WBspsaACeqQarcLGyFMwLWojiYV` | `cbae253a33d486d644ad7d81fd9e9bddb4f0dd5f` | Preview | ERROR | Static output passed, then Vercel Function TypeScript emission failed because the root config restricted `rootDir` to `src`. |
| `dpl_AyU7g3xtmKrXVbw1uWdEX1dRzphw` | `4ca7f8648da014edd375fb85b7ede2c415595c43` | Preview | READY | Build and deployment completed; Vercel emitted two Node.js 22 Functions. |

The successful immutable Preview is:

```text
Deployment ID: dpl_AyU7g3xtmKrXVbw1uWdEX1dRzphw
Deployment URL: https://nested-objects-agent-runtime-90kp8vxsk.vercel.app
Branch alias: https://nested-objects-agent-runti-git-b7da68-autumns-projects-246e052c.vercel.app
Source: Git, PR #326, feature/318-phase-c2-preview-deployment-verification
Commit: 4ca7f8648da014edd375fb85b7ede2c415595c43
Target: Preview
State: READY
Region: iad1
```

`vercel inspect --json` independently matched the deployment ID, project name, URL, team scope, `preview` target, `READY` state, and project output digest. It reported exactly these Function outputs:

- `api/health` on `nodejs22.x`, 5-second timeout
- `api/preview/evaluate` on `nodejs22.x`, 30-second timeout

The failed Production-target attempt is recorded as a boundary breach even though it never became Ready or live. No successful Production deployment, promotion, custom-domain assignment, Production variable, or Production traffic exists.

## Repository and build validation

Commands were run from `apps/agent-runtime` unless stated otherwise.

| Check | Result | Evidence |
| --- | --- | --- |
| Local Node.js | PASS | `v22.22.2`, satisfying `>=22.16.0 <23` |
| npm | PASS | `10.9.7` |
| Dependency install | PASS | 35 packages installed; audit reported 0 vulnerabilities |
| Full package validation at the runtime guard revision | PASS | Format, dependency, dual TypeScript, build, 37 Node tests, two static migration checks, and two Preview checks passed |
| Final format check | PASS | `npm run format:check` after the packaging corrections |
| Final TypeScript checks | PASS | `npm run typecheck` after the packaging corrections |
| Final Preview safety checks | PASS | `npm run preview:check` after the packaging corrections |
| Diff integrity | PASS | `git diff --check` |
| Vercel install and build | PASS | `npm ci --ignore-scripts --no-audit --no-fund` and `npm run build` completed with TypeScript 5.9.3 |
| Vercel Function output | PASS | Two Node.js 22 lambdas emitted and deployment reached `READY` |

The final packaging commits did not change handler semantics. The full local `npm run validate` was not repeated after those packaging-only corrections, so the dependency, unit-test, and static migration checks were not rerun at the exact final packaging revision. The final format, dual TypeScript, and Preview safety gates passed, and Vercel itself ran the package build successfully from the exact tested commit.

The earlier Windows checkout also exposed CRLF conversion. Repository-scoped line-ending policy keeps Agent Runtime text files at LF, and the validation gates passed after normalization.

## Live protected smoke matrix

Deployment Protection remained enabled throughout. The final harness first bound the URL to the exact deployment ID, project ID, team, `Preview` target, `READY` state, and both Node.js 22 Function outputs. It then used the pinned Vercel CLI to access the protected deployment.

The application bearer was never placed in a command argument, local shell/process environment variable, repository file, temporary payload file, documentation, or captured output. It moved once from the authenticated Dashboard process to the terminal process over a random-nonce, one-shot loopback channel, then into curl configuration through process stdin. Request bodies stayed synthetic and in process; only response headers and bodies entered the system temporary directory, which the harness removed in `finally`. The local variable reference was overwritten before process exit, and the ignored harness was not committed.

Every application JSON response passed these common assertions:

- `Cache-Control: no-store, max-age=0`
- `Content-Type: application/json; charset=utf-8`
- `X-Content-Type-Options: nosniff`

The live cases produced:

| Case | Live result | Verified contract |
| --- | --- | --- |
| Safe health | PASS — 200 | Exact safe Preview state: dry run, in-memory workflow, token configured, Supabase absent, persistence/model/mutations false, and no secret or source data |
| Missing bearer with deliberately malformed JSON | PASS — 401 | `PREVIEW_AUTHENTICATION_FAILED` before body parsing and `WWW-Authenticate: Bearer` |
| Deliberately wrong same-length bearer | PASS — 401 | Same sanitized authentication failure; mere non-emptiness is insufficient |
| Reserved example-domain email changed to a real-domain shape | PASS — 400 | Exact `profiles.0.user_email` synthetic-email issue |
| Profile UUID moved outside the reserved Issue #318 namespace | PASS — 400 | Exact `profiles.0.id` namespace issue |
| Unmarked profile Outseta identifier | PASS — 400 | Exact `profiles.0.outseta_person_uid` issue |
| Unmarked conversion member identifier | PASS — 400 | Exact `conversionEvents.0.member_uid` issue |
| Unmarked ActiveCampaign contact identifier | PASS — 400 | Exact `activeCampaignContacts.0.contactId` issue |
| Unmarked ActiveCampaign mirror identifier | PASS — 400 | Exact mirror-map `contactId` issue |
| Nonempty ActiveCampaign custom fields | PASS — 400 | Exact `activeCampaignContacts.0.customFields` empty-object issue |
| `persist: true` | PASS — 403 | Exact `PREVIEW_PERSISTENCE_DISABLED` response; health/configuration also proved persistence false and Supabase absent |
| Unchanged reviewed synthetic fixture | PASS — 200 | Deterministic aggregate response, expected correlation header, and no raw member/contact/source/action data |

The successful evaluation matched these stable values:

```text
runId: 6a3c1abb-7a29-52a5-b601-13c5a85b6198
correlationId: 31800000-0003-5000-8000-000000000003
profiles: 1
conversionEvents: 1
activeCampaignContacts: 1
activeCampaignAssets: 1
projectedMembers: 1
metrics: 21
signals: 0
marketingClassifications: 1
assetClassifications: 1
identityConflicts: 0
unmatchedConversionEvents: 0
duplicateConversionEvents: 0
metricValueStates: known=18, unknown=3
contactClassifications: current_member=1
assetCandidateScopes: nested_objects=1
```

Its safety object was exactly:

```json
{
  "syntheticInputOnly": true,
  "activeCampaignMutations": false,
  "modelExecution": false,
  "productionWrites": false,
  "consequentialExecutors": false
}
```

The response's exact top-level allowlist was `ok`, `phase`, `execution`, `runId`, `correlationId`, `counts`, `signalTypes`, `metricValueStates`, `contactClassifications`, `assetCandidateScopes`, and `safety`. The serialized response omitted the fixture email, contact identifier, member UUID, raw profiles/events/evidence, and action payloads.

Production fail-closed behavior was not tested by changing Vercel configuration or invoking a Production deployment. It remains covered by the compiled handler and configuration guards: a Production environment or malformed runtime configuration must return a sanitized HTTP 503 before authentication or body parsing.

## Runtime telemetry

Post-smoke Vercel telemetry for the exact successful deployment reported:

| Dimension | Count |
| --- | ---: |
| `/api/preview/evaluate` | 11 |
| `/api/health` | 3 |
| HTTP 200 | 4 |
| HTTP 400 | 7 |
| HTTP 401 | 2 |
| HTTP 403 | 1 |

The extra health requests were read-only deployment checks. No `5xx` runtime logs and no runtime error clusters were present for the selected period.

## Guardrails that remain in force

- Keep `deploy/agent-runtime-production-disabled` as the Production Branch. Do not change it to `main`.
- Keep Production environment variables empty.
- Do not promote or redeploy the failed Production-target attempt.
- Do not add or move a custom/existing domain.
- Keep Deployment Protection enabled.
- Do not add Supabase, OpenAI, ActiveCampaign, Outseta, Stripe, production-member, or production-contact credentials during Phase C2.
- Use only the reviewed synthetic fixture family and keep `persist: false`.
- Treat the successful deployment at `4ca7f8648da014edd375fb85b7ede2c415595c43` as the live verification source. A later evidence-only commit does not change the tested runtime tree.

## Limitations and follow-up risks

- The Preview schema uses `pricing_viewed`, `pricing_cta_clicked`, `firm_viewed`, and `purchase_confirmed`, while the production conversion ledger and Phase C core use `pricing_view`, `pricing_cta_click`, `firm_view`, and `purchase`. This does not weaken isolation, but it can reject production-shaped synthetic fixtures or yield semantically incomplete metrics. Resolve it in a focused contract-alignment change.
- The response exposes one `consequentialExecutors: false` umbrella instead of separate flags for email, content publication, external actions, and approval execution. The code path remains non-consequential, but the response does not independently prove four separate flags.
- Synthetic prefixes, reserved UUIDs, and visible labels are enforceable fixture boundaries, not proof of the semantic origin of every string. Operators must continue using generated synthetic fixtures only.
- The runtime guard rejects configured model execution, but an `OPENAI_API_KEY` by itself is dormant and ignored while `AGENT_MODEL_EXECUTION_ENABLED=false`; unrelated dormant service credential names are not all rejected by handler logic. The exact-key Vercel environment audit proved those credentials absent for this deployment, so continued environment auditing remains an operator boundary.
- The application rejects declared oversized bodies and bounds parsed arrays, but a chunked body without `Content-Length` is buffered before the post-read byte check. Vercel request limits and the bearer boundary reduce exposure; a streaming byte cap is a later hardening opportunity.
- Production 503 behavior remains deliberately verified in compiled tests rather than through a live Production invocation.

## Completion boundary

This verification created one isolated Vercel project and one successful protected Preview deployment. It did not create a successful Production deployment, promote a deployment, attach a custom domain, add Production variables, apply a migration, connect Supabase, invoke OpenAI or ActiveCampaign, process real data, enable persistence or mutations, install Workflow or Queues, merge pull request #326, close Issue #318, or revive pull request #324.

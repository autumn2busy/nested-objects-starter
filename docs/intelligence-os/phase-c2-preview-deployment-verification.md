# Issue #318 Phase C2 Preview Deployment Verification

Date: 2026-08-26

Status: Repository preflight complete; isolated Vercel project creation, Preview deployment, and live HTTP smoke testing are blocked on authenticated Vercel write access.

## Scope and tested revisions

- Repository: `autumn2busy/nested-objects-starter`
- Verified `main` baseline: `7e1eab8100b80f42c274816fbb7bf254edaa7545`
- Merged Phase C2 baseline: `f5cba5e36df902b17f13a7ca3764ee5f6fea0802`
- Verification branch: `feature/318-phase-c2-preview-deployment-verification`
- Runtime revision tested: `de8ddeed8220376b4e465fa4709585b0416f9017`
- Planned Preview source: the verification branch above, including the restored configuration-error guard
- Original Phase C2 feature branch: deleted after merge
- Vercel deployment ID or safe Preview identifier: not assigned; no deployment was created

The handoff's deleted-branch fallback would deploy a dedicated branch at the exact merged Phase C2 commit. That commit has a known configuration-error mapping regression, so the planned source intentionally differs: deploy the verification branch only after the focused correction at `de8ddeed8220376b4e465fa4709585b0416f9017`. The tested runtime revision restores the reviewed behavior that normalizes base runtime contract failures into `PreviewRuntimeConfigurationError`. The actual compiled Preview API handler is now covered by a test that requires malformed base configuration to return a sanitized HTTP 503 response before authentication or request-body parsing.

## Local validation evidence

Commands were run from `apps/agent-runtime` unless otherwise stated.

| Check | Result | Evidence |
| --- | --- | --- |
| Node.js | PASS | `v22.22.2`, satisfying the `>=22.16.0` requirement |
| npm | PASS | `10.9.7` |
| Dependency install | PASS | `npm ci` installed 35 packages, audited 36 packages, and reported 0 vulnerabilities |
| Format check | PASS | `npm run format:check` |
| Dependency smoke check | PASS | `npm run dependency:check` |
| TypeScript checks | PASS | Runtime and Vercel API TypeScript configurations passed |
| Build and unit tests | PASS | Runtime and API handlers compiled; 37 tests passed, 0 failed, 0 skipped, 0 todo |
| Migration contracts | PASS (static only) | Both migration contract/shape checks passed; no SQL migration was applied |
| Preview safety checks | PASS | Deployment/dry-run safety and configuration-error mapping checks passed |
| Full package validation | PASS | `npm run validate` completed successfully |
| Diff integrity | PASS | `git diff --check` completed successfully |

The first validation attempt exposed CRLF conversion in the Windows checkout. Repository-scoped line-ending policy now keeps `apps/agent-runtime` text files at LF while preserving binary auto-detection; validation was rerun successfully after normalization.

## Vercel preflight

The required configuration was reviewed before any possible platform mutation:

```text
Project name: nested-objects-agent-runtime
Repository: autumn2busy/nested-objects-starter
Root Directory: apps/agent-runtime
Production Branch: deploy/agent-runtime-production-disabled
Preview source: feature/318-phase-c2-preview-deployment-verification
Production environment variables: none
Custom or existing domains added or moved: none
Promotion to Production: prohibited
```

The live Vercel account is readable through the connected integration. An exact project lookup returned not found. The repository is connected to other Vercel projects, including the member website, but none is the isolated Agent Runtime project. No existing project, Root Directory, Git branch, domain, environment variable, or deployment was changed.

The Vercel CLI and the interactive browser session were not authenticated for write operations. Consequently:

- `nested-objects-agent-runtime` was not created.
- No Preview or Development variables were added.
- No Production variables were added.
- No Supabase, OpenAI, ActiveCampaign, Outseta, Stripe, member-data, or contact-data credential was configured.
- No deployment was created or promoted.
- No custom or existing domain was added or moved. A future Preview will receive a generated Vercel URL; that is not a custom-domain move or Production promotion.

The target project does not yet exist, so it currently has no project-level environment variables of any kind. Production-variable and forbidden-credential checks must be repeated in Vercel immediately after the project is created and before the first deployment.

## Required Preview and Development configuration

Add exactly these values to Preview and Development. Leave Production unselected for every entry.

```text
AGENT_RUNTIME_ENV=preview
AGENT_RUNTIME_MODE=dry_run
AGENT_MUTATIONS_ENABLED=false
AGENT_MODEL_EXECUTION_ENABLED=false
AGENT_WORKFLOW_PROVIDER=in_memory
AGENT_RUNTIME_VERSION=phase-c2-v1
AGENT_TRACE_NAMESPACE=nested-objects-intelligence-os
AGENT_PREVIEW_API_TOKEN=<secure random value of at least 32 characters>
AGENT_PREVIEW_SYNTHETIC_ONLY=true
AGENT_PREVIEW_PERSISTENCE_ENABLED=false
```

Do not manually set `VERCEL_ENV`. Do not configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AGENT_STAGING_PROJECT_REF`, `OPENAI_API_KEY`, `OPENAI_AGENT_MODEL`, or any ActiveCampaign, Outseta, Stripe, production-member, or production-contact value.

## Smoke-test matrix

No live endpoint was available. `PASS` below means the repository test/static gate passed; it is not a claim that the behavior was observed on Vercel.

| Boundary | Repository gate | Live Preview |
| --- | --- | --- |
| `GET /api/health` returns safe healthy state for valid Preview configuration | PASS | NOT RUN — no deployment |
| Health and error responses use `Cache-Control: no-store, max-age=0` | PASS | NOT RUN — no deployment |
| Health response omits tokens, URLs, project identifiers, records, member data, and contact data | PASS | NOT RUN — no deployment |
| Missing bearer authorization returns 401 before body parsing | PASS | NOT RUN — no deployment |
| Real email address is rejected with 400 | PASS | NOT RUN — no deployment |
| UUID outside the reserved Issue #318 namespace is rejected with 400 | PASS | NOT RUN — no deployment |
| Unmarked Outseta/member/lifecycle/ActiveCampaign identifier is rejected with 400 | PASS | NOT RUN — no deployment |
| Nonempty ActiveCampaign custom fields are rejected with 400 | PASS | NOT RUN — no deployment |
| `persist: true` is rejected without a database call | PASS | NOT RUN — no deployment |
| Reviewed synthetic fixture evaluates deterministically | PASS | NOT RUN — no deployment |
| Fixture response contains aggregate data and omits email, member/contact IDs, raw source/evidence, and action payloads | PASS | NOT RUN — no deployment |
| ActiveCampaign mutation, model execution, production writes, and consequential executors remain false | PASS | NOT RUN — no deployment |
| Database persistence remains false | PASS | NOT RUN — no deployment |
| Email sending, content publication, external actions, and approval execution are unavailable | PASS through the aggregate `consequentialExecutors: false` boundary; these are not separate response fields | NOT RUN — no deployment |
| Vercel Production configuration fails closed | PASS in unit/configuration guards; Production was not invoked | NOT RUN by design |
| Malformed base runtime configuration maps to sanitized HTTP 503 | PASS against the compiled API handler | NOT RUN — no deployment |

## Safe operator procedure

The normal Vercel **Add New > Project > Import > Deploy** flow must not be used because it can create an initial deployment before the Production Branch boundary is confirmed. The sequence below still requires careful observation: if connecting Git offers or creates a deployment while Branch Tracking is unset or points to `main`, stop. Do not treat this runbook as proof of platform state until the empty deployment list and disabled Production Branch have both been observed.

1. Authenticate the Vercel CLI as Autumn and select the `Autumn's projects` team:

   ```powershell
   npx --yes vercel@59.7.0 login
   ```

2. Create an empty project without deploying code:

   ```powershell
   npx --yes vercel@59.7.0 project add nested-objects-agent-runtime --scope autumns-projects-246e052c
   ```

3. In Vercel Dashboard, open **Autumn's projects > nested-objects-agent-runtime > Settings > Build and Deployment**. Set **Root Directory** to `apps/agent-runtime` and save. If the Node.js Version control is shown, select Node.js 22.x.
4. Open **Settings > Environments > Production > Branch Tracking**. If the control is available before Git is connected, set it to `deploy/agent-runtime-production-disabled`, save, and confirm it is not `main`.
5. Connect `autumn2busy/nested-objects-starter` through the project's Git settings using a path that does not offer or start an initial deployment. If Branch Tracking was unavailable in step 4, go immediately to **Settings > Environments > Production > Branch Tracking**, set `deploy/agent-runtime-production-disabled`, and save before any push or deployment action. Do not continue while the value is unset or `main`.
6. Open **Deployments** and confirm the list is empty. If a deployment appeared automatically, stop; do not promote, alias, or redeploy it, and record the boundary breach for review.
7. Open **Settings > Environment Variables**. Add the ten values above one at a time with only **Preview** and **Development** selected. Generate the bearer token locally, store it only in Vercel, and do not paste it into a terminal transcript, document, issue, or pull request.
8. Filter environment variables to **Production** and confirm there are zero user-configured values. Clear the environment filter, then search across all environments for each forbidden credential name and confirm every one is absent.
9. Recheck **Settings > Build and Deployment** and **Settings > Environments > Production > Branch Tracking** for the exact Root Directory and Production Branch. Confirm no custom or existing domain was attached or moved; generated `.vercel.app` Preview URLs are expected.
10. From the monorepo root on the verification branch, link the Git repository in monorepo mode. Select the existing `nested-objects-agent-runtime` project when prompted, then inspect the selected project:

   ```powershell
   cd C:\Users\Mother\Projects\nested-objects-starter
   npx --yes vercel@59.7.0 link --repo --scope autumns-projects-246e052c
   npx --yes vercel@59.7.0 project inspect nested-objects-agent-runtime --scope autumns-projects-246e052c
   ```

11. Prove the local source before uploading it. The branch must contain the tested runtime correction, the runtime tree must be unchanged from that correction, and the worktree must be clean. Record the exact `git rev-parse HEAD` value as the deployment source:

    ```powershell
    git branch --show-current
    git merge-base --is-ancestor de8ddeed8220376b4e465fa4709585b0416f9017 HEAD
    git diff --exit-code de8ddeed8220376b4e465fa4709585b0416f9017 -- .gitattributes apps/agent-runtime
    git status --short
    git rev-parse HEAD
    ```

12. Run a no-deploy manifest inspection from the monorepo root. Confirm the selected project/team and `apps/agent-runtime` Root Directory, and confirm member-application files are not in the upload:

    ```powershell
    npx --yes vercel@59.7.0 deploy --dry --format=json --project nested-objects-agent-runtime --scope autumns-projects-246e052c
    ```

13. Create an explicit Preview deployment from the same clean revision. Do not use `--prod` and do not promote it:

    ```powershell
    npx --yes vercel@59.7.0 deploy --target=preview --project nested-objects-agent-runtime --scope autumns-projects-246e052c
    ```

14. Record only the non-secret deployment identifier and generated Preview URL, then run every live smoke test in the matrix. Keep the bearer token out of shell history and captured output.

## Limitations and follow-up risks

- Live platform configuration and HTTP behavior remain unverified until authenticated Vercel write access is available.
- The Preview input schema uses `pricing_viewed`, `pricing_cta_clicked`, `firm_viewed`, and `purchase_confirmed`, while the production conversion ledger and Phase C projection core use `pricing_view`, `pricing_cta_click`, `firm_view`, and `purchase`. This does not weaken isolation, but it can reject production-shaped synthetic event fixtures or yield semantically incomplete metrics. Resolve it in a focused contract-alignment change.
- The response exposes one `consequentialExecutors: false` umbrella instead of separate flags for email, content publication, external actions, and approval execution. The code path remains non-consequential, but the live verification checklist should record this representation explicitly.
- Synthetic prefixes, reserved UUIDs, and visible labels are enforceable fixture boundaries, not proof of the semantic origin of every string. Preview operators must continue using generated synthetic fixtures only.
- The application rejects declared oversized bodies and bounds parsed arrays, but a chunked body without `Content-Length` is buffered before the post-read byte check. Vercel platform request limits and the bearer boundary reduce exposure; a streaming byte cap is a later hardening opportunity.

## Completion boundary

This verification did not create or promote a Production deployment, add Production variables, apply a migration, connect Supabase, invoke OpenAI or ActiveCampaign, process real data, enable persistence or mutations, install Workflow or Queues, merge a pull request, close Issue #318, or revive PR #324.

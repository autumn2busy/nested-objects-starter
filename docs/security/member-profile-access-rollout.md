# Member profile privacy: manual rollout

Status: **not a completed Production privacy fix**. SQL has not been executed.

On 2026-09-02, a Production HEAD-only check of the anonymous `profiles` REST endpoint returned HTTP 206 with a nonzero content range. That establishes anonymous row access without downloading member payloads. Application route guards do not close this database path. Production remains exposed until an approved database lockdown and all alternate-access checks pass.

A HEAD check of `resume_workspace` returned HTTP 200 with no rows. This is inconclusive: an empty table/result is not proof of a deny policy. Preserve the existing authenticated owner RLS; this change does not modify that table.

## Intended access

| Viewer | `/members` | `/members/<profile UUID>` |
| --- | --- | --- |
| Signed out or invalid session | Login; no member data | Login; no member data |
| Individual, including Free and paid/Agency | Redirect to own `/profile` | Own profile only, including unpublished; other IDs return not-found |
| Any other signed-in account | Redirect to own `/profile`; no directory | Own profile only; another member's profile returns not-found |

Ownership requires a verified Outseta person `sub` bound to `profiles.outseta_person_uid`, plus the requested profile UUID. Missing or uncertain bindings fail closed; do not repair them by guessing from email, account ID, or subscription ID during a read.

This is an inspector-first release. The firm product is a separate, deferred lane: no firm directory, firm-account grants, or firm-account setup are part of this change. Every authenticated account is restricted to its own profile. Paid/Agency plans, editable profile roles, publication status, and any stale firm-related environment setting cannot authorize another member's profile. Any future firm access requires a separately designed, reviewed, and approved product/access model.

## Approval gates and order

1. **Review and release app compatibility first**, through the normal explicit merge/Production approval gates. Confirm the exact deployed commit and environment. `/members` must authenticate and redirect to the account's own `/profile` without querying directory rows; profile details must authorize ownership before privileged reads. Metadata must stay generic; pages must be dynamic/no-store. AuthProvider and the header must use authenticated `/api/profile`, not browser anonymous profile queries. Existing reviews of hiring firms must render approved rating/comment/date with author `Member`, without a profiles join or identity in JSON-LD. Do not apply the database change to an older incompatible app release.
2. **Run the catalog-only preflight** from [the manual SQL candidate](../../infra/sql/manual/20260902_member_profile_privacy.sql), Section A only. Confirm the selected project/database; record results before any DDL. Do not query member rows, download profiles, or paste keys/tokens into evidence.
3. **Resolve every preflight exception**, particularly exposed views/RPCs and bypass roles. This candidate changes only `public.profiles`; it does not repair alternative entry points automatically. An unresolved leak means stop, request a separately reviewed change, and continue reporting privacy as incomplete.
4. **Obtain explicit approval for this exact database change** and a bounded change window. Include the target database, compatible app commit, preflight evidence, rollback metadata, verification owner, and any separately approved view/RPC changes.
5. **Apply only the reviewed transaction** in Section B manually. The acknowledgment is deliberately commented out, and the candidate ends in `ROLLBACK`. Do not pipe the whole file into a migration runner. A reviewed applied copy must deliberately enable the acknowledgment and replace the terminal rollback with commit. These edits document operator intent; they are not substitutes for approval. Keep lock/statement timeouts; an error requires rollback and investigation, not an automatic retry or broader revoke.
6. **Verify both app and direct database paths** below. Record evidence separately for repository tests, deployed app behavior, and database enforcement. Mark complete only when all relevant paths are closed and legitimate flows still work.

## Required preflight and rollback metadata

Save metadata in restricted operational storage, not in this repository: timestamp, operator, approval reference, database/project identifier, server version, app commit, table/schema owners, RLS/force-RLS flags, policy definitions and roles, table and column ACLs/grantors/grant options, effective role privileges and memberships, relevant default ACLs, dependent-object definitions/owners/ACLs, and service-role permissions. Capture this **before** running Section B; revoking a table privilege can also affect related column grants. Do not archive member rows or service credentials.

Review these explicitly:

- `profiles` is the intended ordinary table; inspect partitions/inheritance, triggers, rules, foreign keys, and other schema entry points. A different layout requires a revised plan.
- `anon` and `authenticated` are neither superusers nor `BYPASSRLS`, do not own the table, and cannot assume an owner/bypass role. Inspect inherited rights, `PUBLIC`, column grants, alternate grantors, and schema privileges. RLS does not protect `TRUNCATE`; unexpected administrative privileges require separate review.
- The compatible app really uses a server-only service client for self-profile read/edit/avatar persistence, owner-authorized profile details, review submission, and required webhook/admin/background flows. Confirm its existing table/schema privileges and RLS bypass/owner behavior. Do not expose its key or add browser grants to make a broken app work. This candidate preserves `service_role` grants and does not force owner RLS.
- Inventory **all exposed API schemas**, recursive dependent views, materialized copies, RPCs, functions, and other APIs that can return profiles or resume data. Inspect view owners and `security_invoker`; inspect security-definer functions, callable grants, nested calls, search paths, and dynamic SQL. Catalog dependencies and function-name scans are only leads: a function body can reference a table without a recorded dependency. Review source privately without logging embedded secrets. Do not invoke application functions/RPCs during this catalog-only preflight.
- Resolve any leaking definer view/RPC before declaring privacy fixed. Possible reviewed remedies include an appropriate invoker view, removing the exact exposed grant/endpoint, or adding trusted authorization inside the function. Do not blindly alter every view, revoke all functions, or delete existing policies.
- Keep `resume_workspace`'s authenticated owner policies unchanged. Its UUID `auth.users` ownership is distinct from Outseta person identity. Review its live policies/grants and any exposing views/RPCs separately; do not assume the earlier empty HEAD result proves safety.
- Review approved `firm_reviews` access: removing the UI join does not remove `profile_id` from direct approved-row access. Public avatar URLs, historical exports/search caches, and already downloaded data are not withdrawn by table RLS. Record any additional privacy scope requiring its own approval.

The candidate enables profile RLS, adds one restrictive `FOR ALL` policy with false read/write predicates for `anon` and `authenticated`, and revokes their direct SELECT/INSERT/UPDATE/DELETE grants. Existing permissive policies remain but cannot override the restrictive predicate for those roles. Table owners, superusers, and bypass roles need separate scrutiny. See [PostgreSQL CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html) and [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Verification matrix

Use approved synthetic fixtures/accounts only, with known ownership bindings and at least one published and one unpublished profile. Keep browser sessions isolated; never log cookies, access tokens, full URLs containing tokens, or real member payloads. Creating fixtures, submitting reviews, or changing profiles requires explicit test-write authorization; otherwise record those checks as pending.

| Check | Required result |
| --- | --- |
| Signed-out and invalid/expired-cookie `/members` and detail requests | No profile data in HTML/RSC/metadata; login handoff remains safe |
| Free individual and paid/Agency individual | Neither can list members or view another synthetic member; plan does not confer cross-member access |
| Synthetic owner, published and unpublished | Own UUID succeeds; a different UUID, malformed UUID, or missing binding fails closed |
| Published and unpublished profiles owned by another synthetic member | Both return not-found for every account; publication is not access authority |
| Stale firm-related configuration or editable role | Cannot enable directory access or bypass ownership; own profile still works |
| Legacy `/profile/<UUID>` alias, direct detail, client navigation/prefetch | Same authorization after redirect; no alternative member-data route |
| Profile response headers and metadata | Private/no-store, no-referrer, noindex; no shared/CDN profile cache; generic metadata on denied requests |
| Direct anonymous and Supabase `authenticated` table access | No readable or writable profile rows; verify with approved synthetic REST tests and effective grant checks, independent of the Outseta cookie |
| HEAD/count, selected-column, nested relationship, exposed view/RPC/GraphQL paths | No profile payload or profile count leakage; do not infer safety from HTTP 200 with an unseeded/empty result |
| Own `/api/profile` GET/edit, header name/avatar, avatar upload | Correct synthetic owner's data; writes persist through server-only access; another owner is not changed |
| Approved reviews of hiring firms and authorized review submission | Rating/comment/date remain; UI and JSON-LD contain `Member`, not personal reviewer name/avatar; submission still resolves its owner server-side |
| Fresh auth callback, cookie-only restore, delayed old SDK token, logout | Verified cookie remains authoritative; profile failure does not clear valid auth; stale hydration and SDK fallback do not replace the new session |
| Required service-role webhook/admin/background operations | Existing approved synthetic checks succeed without widening browser privileges |

For direct-table HEAD checks, record only status and bounded count/range evidence. After grant revocation, permission denial is expected; a zero-row response is acceptable only with verified policy/grant evidence and a known synthetic fixture. Never weaken RLS merely to obtain a more convenient HTTP status. Use separate authorized non-mutating checks for resume access; do not test writes against real profiles.

Fresh local evidence on 2026-09-02 after inspector-only scope alignment: 39/39 combined tests, full `npm run lint`, `tsc --noEmit --incremental false`, `audit:member-surfaces`, and `audit:free-to-pro` (18/18) passed. Those tests use real signed synthetic JWTs with a mocked database; they do not establish live Supabase behavior. Coverage includes denial of every cross-member request, ignored stale firm configuration, no directory queries, and truthful private-profile settings.

Actual local Next.js requests to `/members` and a synthetic UUID detail returned login redirects for both missing and forged cookies, with no-store and noindex/noarchive headers. The extended `verify:member-tools-runtime` checks passed against canonical `http://localhost:3021`; an initial `127.0.0.1` origin mismatch was corrected without changing auth code. A local browser rendered `/tools` without an error overlay; the sandbox blocked a Google font download, so a fallback font was used. The temporary browser and development server were closed afterward. Authenticated Preview journeys, full database enforcement tests, and Production privacy verification remain pending. Re-run against the final deployed commit and record exact commands/results before completion.

## Failure and rollback

Prefer fix-forward while keeping anonymous profile access closed. Before commit, roll back the failed transaction. After commit, triage whether the fault is an app version mismatch, missing reviewed ownership binding, service permission/configuration, or an alternate access path. Do not disable RLS, drop the deny policy, restore public browser grants, or roll back to an app that requires anonymous profiles as an expedient repair.

Any database rollback requires explicit approval of a narrow reviewed plan derived from the saved metadata. Restore only necessary, reviewed metadata while maintaining the deny boundary; a blanket restoration of the known-exposing previous state is not an acceptable rollback. The script intentionally contains no automatic reversal, policy cleanup, data deletion, or resume-table mutation.

Completion record: approved app commit/deployment; catalog preflight and saved metadata location; database approval/operator/time; exact applied transaction; synthetic verification results; residual risks; and whether any live mutation occurred. No firm-account identities or firm grants are required for this release. Until that record is complete, report **app safeguards implemented; Production database privacy not yet verified**.

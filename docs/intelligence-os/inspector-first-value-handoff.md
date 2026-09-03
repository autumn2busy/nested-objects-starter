# Inspector first-value guide: Preview handoff

> **Superseded for current status on 2026-09-03.** Preserve this as PR #339's dated evidence only. Current status and remaining work live in the [canonical execution ledger](issue-318-foundation-execution-ledger.md).

Date: 2026-09-02
Branch: `codex/inspector-first-value`
Base: `bb3d6a3e12983301e7d17e7d12f3664b32f92154` (main after #338)
Status: local verification passed; user approved commit, push, and Preview PR publication on 2026-09-02. Merge, Production release, and database changes are not authorized by that approval.

## What changed

- Welcome and dashboard onboarding share one inspector-first guide: research hiring firms, read the inspector overview, and manage a private profile.
- The primary action is `/hiring-firms`; profile preparation is secondary, not a prerequisite. Directory access still follows the member's existing plan.
- A responsive dark-green primary panel makes the next action prominent. All dark-panel text has explicit light colors; links and the guide toggle have visible keyboard-focus styling and minimum 44px target heights.
- Hiding the guide changes local component state only and can be undone during the visit. It no longer calls the completion action, updates `onboarding_completed_at`, or sends `onboarding-complete`. It reappears on a fresh mount; this is intentionally not a persistent preference.
- The dashboard's existing completion-based visibility condition is unchanged. Previously completed members are not reset or re-onboarded.
- Welcome distinguishes loading, signed-out, confirmation guidance, and authenticated states without asserting an account was created or an email was sent from a URL parameter alone.
- Removed the dashboard's misleading map shortcut and unsupported "50+ new leads" claim. Tools remain labeled as a preview, not a required onboarding step.

## Boundaries preserved

- No authentication provider, signed-login handoff, middleware, profile ownership, API authorization, pricing, entitlement, or database changes.
- Existing welcome signup and activation effects are unchanged. No new analytics or marketing events were introduced.
- No infrastructure configuration, dependencies, environment files, firm-side product features, live accounts, payments, or email sends changed.
- Earlier privacy execution records and unrelated worktree files remain separate from this UI slice.

## Verification

Passed locally:

- 46/46 combined auth handoff, auth-provider race, profile privacy, and inspector-start regression tests. Seven new actual-source synthetic tests exercise guide hierarchy, hide/reopen, welcome states, existing once-per-mount signup effects, and quick-action copy. The existing CI workflow now includes them.
- Publication recheck after incorporating #338: 61/61 tests passed with the same suites plus the existing pricing-accuracy suite.
- `npm.cmd run lint`: no warnings or errors.
- `tsc.cmd --noEmit --incremental false`.
- `npm.cmd run audit:member-surfaces`.
- `npm.cmd run audit:free-to-pro`: 18/18 source-contract and synthetic lifecycle checks.
- Browser: real guide desktop render, 390px iframe responsive render, hide/reopen interaction, `/welcome` signed-out state, `/welcome?new_user=true` confirmation state, and inspector-guide navigation.
- `git diff --check`.

Browser verification used a local development server with synthetic database credentials and the existing Preview/admin tracking-suppression mode. No credentials were entered, accounts created, or login/registration/payment flows submitted. The server was stopped and the temporary component-render route was removed after inspection. Next.js retained a generated type file for the deleted fixture; that single stale generated file was removed before the final typecheck.

Limits: authenticated welcome behavior was tested against the actual component with synthetic auth/SDK dependencies, not a newly created live member. No Production deployment, real conversion measurement, live lifecycle delivery, or cross-browser/device certification is claimed. Google font downloads were blocked by the local network sandbox, so visual checks used the fallback font; development webpack cache warnings did not prevent successful page renders. The production build was intentionally not run under repository instructions.

## Preview release gate

The publication scope is only this frontend slice, its tests/CI entry, and this handoff. Verify the deployed Preview with the configured font and an authorized member session before requesting a Production release. Earlier privacy SQL/runbook edits, the unrelated membership-audit script, and the parallel quality workplan are excluded from this PR.

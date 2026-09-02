# Homepage direct Free signup: Preview handoff

Date: 2026-09-02
Branch: `codex/homepage-free-signup`
Base: `1e7c92ebe717f895d98a0d1560a5051d1673b249` (main after #339)
Release scope: implementation and draft Preview PR; no merge, Production promotion, database/configuration changes, account creation, or marketing sends.

## Change

- Four homepage placements share `FreeSignupCta`: hero, mobile start section, beginner section, and final banner.
- Visitors receive a native direct Free-registration link using `PLAN_UIDS.FREE` and the exact hosted fallback already used by pricing. No SDK readiness or pricing-page step is needed for navigation.
- Auth-loading controls are genuinely disabled and labelled; authenticated members receive `Open my dashboard`, never a new Free registration or plan-change action.
- Pricing remains available through separate comparison links. Prices, paid options, entitlements, shared header/mobile navigation, authentication, login return, confirmation settings, and welcome-page behavior are unchanged.
- Intent uses only the existing `join_free_click` helper, with a placement identifier. No signup-completed, trial, or modal-open event is fabricated by a link click. Native keyboard, modifier/new-tab, and middle-click behavior is preserved; tracking exceptions cannot block navigation.
- The component introduces no effect, SDK invocation, direct storage/database access, dependency, or new event type. Existing conversion collection handles its normal event.

## Verification

- 68/68 actual-source synthetic regression tests passed: auth login return, auth-provider race, profile privacy, onboarding guide, homepage signup, and pricing accuracy. The seven new homepage tests are included in the existing CI command.
- Lint, TypeScript, member public-surface audit, and Free-to-Pro audit (18/18) passed.
- Local homepage HTTP 200 contained all four controls. Browser inspection confirmed four hydrated direct Free links and no framework error overlay.
- Desktop and 390px iframe views showed the Free actions with separate comparison links. The temporary mobile fixture was removed before publication.
- A final local navigation remained in the existing auth-loading state after hot reload. One clean development-server restart recovered the hydrated links and returned `/api/auth/session` 200. Keyboard navigation then focused the hero Free action with a visible green outline. This does not establish the cause of the transient local loading state or verify a real signed-in session.
- Clicking the real hero link opened the hosted `Sign up` form with empty email/name fields and a disabled submit button. No fields were filled or account submitted. This confirms navigation, not completed registration or email delivery.
- The local conversion request returned 204 under existing Preview/admin tracking suppression, before limiter/database/marketing access. Dummy database credentials and disabled local Outseta loading were process-only settings; no environment file changed.
- Local startup/font loading caused initial navigation timeouts; after compilation, browser verification succeeded. Google font downloads were sandbox-blocked and a fallback font was used. No production build was run, per AGENTS.md.

## Preview acceptance

Verify the configured font, mobile layout and keyboard focus on the actual Preview. With an authorized existing member session, confirm the dashboard action. Registration completion, confirmation email/password setup, and return to onboarding require a separately authorized account-flow test; they were not exercised here and their configuration was not changed. No conversion uplift is claimed without post-release data.

Publish only this UI slice, its test/CI entry, and this handoff. Exclude unrelated privacy SQL/runbook edits, audit/workplan files, and the concurrently added vendor-opportunity files and migration.

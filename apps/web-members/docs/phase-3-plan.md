# Phase 3: Member Experience, Automation, and Product Polish

## Overview
Phase 3 focuses on refining the user experience for both Members and Guests, hardening automation reliability, improving performance, and establishing enterprise-grade configuration boundaries. This phase explicitly **excludes** building Firm-specific features (billing, plans, tooling), except for necessary scaffolding to prevent broken UX.

## User Journeys & Analysis

### 1. New Member Onboarding
-   **Current State**: User signs up via Outseta -> Redirected to `/dashboard` or `/auth/callback`. Dashboard shows generic widgets. No clear "first steps".
-   **Friction**: Users may feel lost ("What do I do next?"). Profile is likely empty (no avatar, no specialized fields).
-   **Fix**: Introduce a dedicated "Onboarding Checklist" visible only to new/incomplete members.
    -   Complete Profile (Avatar, Phone).
    -   Set Service Area (if applicable).
    -   Try a Tool.
    -   Join Community.

### 2. Guest Experience
-   **Current State**: Guests might stumble upon valid routes but see "Access Denied" or broken UI elements intended for members (e.g., "Back to Dashboard" links).
-   **Friction**: Dead-ends, confusing navigation, lack of clear Conversion Funnel (CTAs).
-   **Fix**:
    -   Clear Empty States for restricted content.
    -   Consistent "Log In" / "Sign Up" CTAs replacing member navigation.
    -   Hide "Dashboard" references.

### 3. Automation Reliability
-   **Current State**: AI tools call n8n webhooks directly via `fetch`. No standardized retries, timeouts, or error mapping.
-   **Friction**: Flaky connections or n8n timeouts cause generic 500 errors. No idempotency means potential double-charging/double-execution if retried manually.
-   **Fix**:
    -   Shared `callN8nWebhook` helper.
    -   Idempotency keys.
    -   Standardized error responses.

## Prioritized PR List

### [P0] PR 3.1: Member Onboarding Flow
-   **Scope**:
    -   Create `OnboardingChecklist` component.
    -   Add `onboarding_completed_at` (or similar JSON state) to `profiles` table.
    -   Show checklist on Dashboard if incomplete.
-   **Acceptance Criteria**:
    -   New members see checklist on first login.
    -   Completing items updates state.
    -   Can be dismissed/minimized.
-   **Test Plan**:
    -   Unit test: Checklist logic (progress calculation).
    -   Smoke test: New user login -> verify checklist appears -> dismiss -> verify persistence.

### [P1] PR 3.2: Guest Experience Cleanup
-   **Scope**:
    -   Audit navigation for `!isAuthenticated`.
    -   Replace "Dashboard" links with "Login".
    -   Standardize "Access Denied" / "Upgrade" gates with clear CTAs.
-   **Acceptance Criteria**:
    -   Guests never see "Back to Dashboard".
    -   Protected pages show clear "Join Now" funnel.
-   **Test Plan**:
    -   Route test: Visit pages as unauthenticated user.

### [P1] PR 3.3: Accessibility & Reduced Motion
-   **Scope**:
    -   Review Hero animations (Globe/Lightbulb).
    -   Implement `prefers-reduced-motion` media query logic.
-   **Acceptance Criteria**:
    -   Animations disable/simplify when OS setting is enabled.
-   **Test Plan**:
    -   Manual verification via Chrome DevTools "Rendering" tab.

### [P2] PR 3.4: Performance Wins
-   **Scope**:
    -   Lazy load heavy components (Maps, D3).
    -   Add lightweight skeletons/fallbacks.
-   **Acceptance Criteria**:
    -   LCP (Largest Contentful Paint) improves.
    -   No layout shifts (CLS) on load.
-   **Test Plan**:
    -   Lighthouse run before/after.

### [P1] PR 3.5: Automation Reliability Layer
-   **Scope**:
    -   Create `lib/n8n-client.ts`.
    -   Refactor `api/ai/*` to use it.
    -   Add Request ID logging.
-   **Acceptance Criteria**:
    -   Timeout handling (e.g., 30s).
    -   Consistent JSON error format.
-   **Test Plan**:
    -   Unit test `n8n-client` with mock fetch (success, fail, retry).

### [P0] PR 3.6: Feature Flags & Config
-   **Scope**:
    -   Create `lib/config.ts` (Env validation).
    -   Create `lib/features.ts` (Flags).
    -   Flag "Firms" features as `COMING_SOON`.
-   **Acceptance Criteria**:
    -   App fails to build if critical Envs missing.
    -   Experimental features hidden in Prod.
-   **Test Plan**:
    -   Unit test config validation.

## Execution Strategy
-   Strict sequential execution (PR 3.1 -> Review -> PR 3.2 ...).
-   No direct commits to `main`.
-   Manual verification screenshots for UI changes.

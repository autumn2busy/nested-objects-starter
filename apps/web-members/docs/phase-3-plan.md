# Phase 3: Member Experience, Automation, and Product Polish

> **Superseded for current implementation status on 2026-09-03.** Preserve this as historical planning input. Current tasks, decisions, evidence, and handoff live only in `docs/intelligence-os/issue-318-foundation-execution-ledger.md`.

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

### [DONE] PR 3.1: Member Onboarding Flow
-   **Scope**:
    -   Create `OnboardingChecklist` component.
    -   Add `onboarding_completed_at` to `profiles` table.
    -   Show checklist on Dashboard if incomplete.
-   **Status**: Merged.

### [DONE] PR 3.2: Guest Experience Cleanup
-   **Scope**:
    -   Audit navigation for `!isAuthenticated`.
    -   Replace "Dashboard" links with "Login".
-   **Status**: Merged.

### [DONE] PR 3.3: Accessibility & Reduced Motion
-   **Scope**:
    -   Implement `prefers-reduced-motion` media query logic.
-   **Status**: Merged.

### [DONE] PR 3.4: Performance Wins
-   **Scope**:
    -   Lazy load heavy components.
    -   Preconnect to CDNs.
-   **Status**: Merged.

### [DONE] PR 3.5: Error Boundaries (Reliability)
-   **Scope**:
    -   Implemented Next.js `error.tsx` boundaries.
    -   Created `ErrorView` component.
-   **Status**: Merged.

### [IN PROGRESS] PR 3.6: Feature Flags & Final Polish
-   **Scope**:
    -   Create `lib/env.ts` (Env validation).
    -   Create `lib/features.ts` (Flags).
    -   Final Lint & Cleanup.
-   **Status**: Implementation started.

## Execution Strategy
-   Strict sequential execution (PR 3.1 -> Review -> PR 3.2 ...).
-   No direct commits to `main`.
-   Manual verification screenshots for UI changes.

# Phased Launch Roadmap

## Phase 0: Release Safety & Observability Baseline (Complete)
**Goal**: Ensure the ship doesn't sink silently. Secure the perimeter.
**Risk**: Low (mostly config)
**Definition of Done**: Sentry receiving events, `npm audit` clean, Middleware active.

*   [x] `AUD-SEC-003`: Fix Dependency Vulnerabilities (`npm audit fix`)
*   [x] `AUD-REL-001`: Install Sentry (Error Monitoring)
*   [x] `AUD-SEC-001`: Create `middleware.ts` (Global Route Protection)
*   [x] `AUD-SEO-001`: Add `robots.txt`
*   [x] `AUD-SEC-004`: Remove PII Logging in Webhooks
*   [x] `AUD-SEC-002`: Add Security Headers (`next.config.mjs`)

## Phase 1: Critical Logic, Data & Billing (Code Complete)
**Goal**: Ensure data is saved correctly, plans are honored, and RLS doesn't leak or block valid data.
**Risk**: High (Database & Billing Logic)
**Definition of Done**: RLS policies verified, Founders plan works, Schema matches DB.

*   [x] `AUD-DB-001`: Fix Profiles vs Users Schema Ambiguity
*   [x] `AUD-DB-002`: Resolve Jobs RLS Policy Conflict
*   [x] `AUD-BIL-001`: Fix Founders Plan Mapping in Webhook
*   [x] `AUD-SEC-005`: Refactor Hardcoded Plan UIDs
*   [x] `AUD-DB-004`: Add Critical Index (`idx_profiles_email`)
*   [x] `AUD-DB-003`: Verify/Fix Directory RLS Access

## Phase 2: Paid Ads Readiness (Analytics & Credibility)
**Goal**: Enable paid traffic. Ensure we track them and don't scare them away with broken UX.
**Risk**: Medium (Frontend UX)
**Definition of Done**: Pixels firing, Cookie banner present, Homepage has no "fake" elements.

*   `AUD-CMP-001`: Implement Cookie Banner
*   `AUD-ANA-001`: Add Ads Pixels (FB, LinkedIn, Google)
*   `AUD-UX-001`: Fix "Fake" Ticker Trust Signal
*   `AUD-UX-002`: Unhide Free Plan on Homepage
*   `AUD-UX-005`: Soften Income Calculator Gate (Allow dummy result/1 use)
*   `AUD-SEO-004`: Optimize Homepage Keywords

## Phase 3: Directory Performance & Experience
**Goal**: Make the core product (Directory) scalable and usable.
**Risk**: High (Major Refactor of Directory Logic)
**Definition of Done**: Directory supports pagination/search via DB, decent performance.

*   `AUD-PER-001`: Implement Server-Side Pagination for Directory
*   `AUD-PER-002`: Implement Server-Side Filtering (Supabase)
*   `AUD-UX-003`: Fix Directory Search Gate (Allow search, gate results)
*   `AUD-DB-005`: Add remaining Performance Indexes
*   `AUD-SEO-003`: Update Sitemap for dynamic routes

## Phase 4: Polish, SEO & QA
**Goal**: Final touches for organic growth and long-term stability.
**Risk**: Low
**Definition of Done**: E2E test passes, Schema valid, Mobile UI fixed.

*   `AUD-SEO-002`: Add Schema to Role Pages
*   `AUD-UX-006`: Fix Tools Blur Visibility
*   `AUD-UX-007`: Fix Mobile Pricing Table Stacking
*   `AUD-CMP-002`: Add Privacy/Terms Links to Footer
*   `AUD-QA-001`: Create E2E Auth Test (Playwright)
*   `AUD-UX-004`: Add "Aha Moment" / Profile Completion Widget (Time permitting)

## Phase 5: Final Launch Decision
*   Review all verification checklists.
*   Go/No-Go Decision.

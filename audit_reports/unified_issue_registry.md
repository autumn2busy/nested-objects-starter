# Unified Issue Registry

**Source**: Audit Reports (Security, Performance, UX, SEO, QA, RLS, Compliance)
**Date**: 2026-02-05

| ID | Title | Category | Severity | Findings/Evidence | Recommended Fix | Effort |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUD-SEC-001** | Missing Middleware Protection | Security | High | No `middleware.ts`. Route protection relies on client-side or per-page logic. | Create `middleware.ts` to protect `/dashboard`, `/portal` routes. | S |
| **AUD-SEC-002** | Missing Security Headers | Security | High | `next.config.mjs` missing `X-Content-Type-Options`, `HSTS`, etc. | Add `headers()` config to `next.config.mjs`. | S |
| **AUD-SEC-003** | Dependency Vulnerabilities | Security | High | `npm audit` exited with code 1. | Run `npm audit fix`. | S |
| **AUD-SEC-004** | PII Logging in Webhooks | Security | Med | `api/webhooks/outseta` logs payloads with PII. | Remove `console.log(payload)` from webhook routes. | S |
| **AUD-SEC-005** | Hardcoded Plan UIDs | Security | Med | `api/ai/concierge` has hardcoded plan IDs. | Move IDs to `lib/plan-config.ts` or constants. | S |
| **AUD-REL-001** | No Error Monitoring | Reliability | Critical | Sentry is missing. | Install Sentry (`npx sentry-wizard`). | M |
| **AUD-ANA-001** | Missing Ads Pixel | Analytics | Critical | No FB/LinkedIn/Google pixels found in `layout.tsx`. | Add pixels via `next/third-parties` or `layout.tsx`. | S |
| **AUD-QA-001** | Missing Automated Tests | QA | Critical | No E2E tests for Auth/Signup flow. | Create Playwright test for login/signup. | M |
| **AUD-SEO-001** | Missing robots.txt | SEO | Critical | File missing. | Create `public/robots.txt`. | S |
| **AUD-SEO-002** | Unused Schema | SEO | Critical | `roles/inspector` missing Schema markup. | Inject JSON-LD in `app/roles/[slug]/page.tsx`. | S |
| **AUD-SEO-003** | Incomplete Sitemap | SEO | High | `sitemap.ts` misses dynamic routes. | Update `sitemap.ts` to fetch dynamic slugs. | S |
| **AUD-SEO-004** | Background Keywords | SEO | Med | Homepage title lacks "Field Inspector Directory". | Update `metadata` in `app/page.tsx`. | S |
| **AUD-DB-001** | Profiles vs Users Ambiguity | Data | Critical | Code uses `profiles`, schema defines `users`. | Align SQL schema with app code (Use `profiles`). | M |
| **AUD-DB-002** | Jobs RLS Conflict | Data | Critical | `jobs` has conflicting policies (Own vs Read Auth). | Consolidate policies to enforce correct access. | S |
| **AUD-DB-003** | Directory Access RLS | Data | Critical | Directory page fetches all profiles; RLS might block. | Ensure RLS allows public/auth read of directory profiles. | S |
| **AUD-DB-004** | Missing Index: Email | Data | Critical | No index on `profiles.user_email`. | Create index `idx_profiles_email`. | S |
| **AUD-DB-005** | Missing Performance Indexes | Data | Med | Missing indexes on `created_at`, `subscription_tier`. | Create remaining indexes. | S |
| **AUD-BIL-001** | Founders Plan Mapping Gap | Billing | Critical | Webhook `mapPlanToTier` misses "Founders" plan. | update `api/webhooks/outseta/route.ts` mapping. | S |
| **AUD-PER-001** | Unbounded Fetch | Performance | High | `getMembers` fetches all rows without limit. | Implement pagination/infinite scroll + limit. | M |
| **AUD-PER-002** | Client-Side Filtering | Performance | High | Directory filters happen in JS after fetching all. | Move filtering to Supabase query. | M |
| **AUD-UX-001** | Fake Ticker Trust Signal | UX | High | "LIVE DATA FEED" is static. | Connect to real data or rename to "Recent Highlights". | S |
| **AUD-UX-002** | Hidden Free Plan | UX | High | Free plan buried on homepage. | Promote "Join for Free" button. | S |
| **AUD-UX-003** | Directory Search Gate | UX | High | Search disabled for guests. | Allow search, gate results (show count). | M |
| **AUD-UX-004** | Missing Aha Moment | UX | High | No clear first action on dashboard. | Add "Profile Completion" or "Find First Firm" widget. | L |
| **AUD-UX-005** | Income Calculator Gate | UX | High | Calculator gated behind login. | Allow 1 use or dummy result before gate. | M |
| **AUD-UX-006** | Tools Blur | UX | Med | Tools cards fully blurred. | Unblur header/desc, blur only button. | S |
| **AUD-UX-007** | Mobile Pricing Stacking | UX | Med | 5 cards stack on mobile. | Use tabs or scroll snap. | M |
| **AUD-CMP-001** | Missing Cookie Banner | Compliance | High | No banner to block tracking scripts. | Implement Cookie Banner logic. | M |
| **AUD-CMP-002** | Privacy Links Visibility | Compliance | Med | Missing in Footer. | Add links to Footer. | S |

# Security Audit Report

**Date:** 2026-02-05
**Scope:** Auth, Session, API, RLS, Secrets, Dependencies, Rate Limiting, AI

## 1. Threat Model Summary

*   **Actors:**
    *   **Public/Anonymous:** Can access landing pages, public directory (read-only), auth endpoints.
    *   **Authenticated User:** Can access portal, manage own profile, use tools based on Plan entitlement.
    *   **Service Role (Server):** Full access to database (via RLS bypass) and third-party APIs (Outseta, n8n).
*   **Assets:**
    *   **User PII:** Emails, phone numbers, addresses (High Sensitivity).
    *   **Firm Data:** Publicly aggregated but enriched data (Medium Sensitivity).
    *   **AI Quota:** Cost-bearing resources (High Sensitivity).
    *   **Integrity:** Webhook processing (High Sensitivity).

## 2. Findings & Severity

### 🚨 Critical / High
- **[High] Missing Middleware Protection:** The project has no `middleware.ts`. Route protection relies entirely on per-page or per-component logic.
    - *Risk:* Accessing `/dashboard` or `/(portal)` routes might render UI shell even if unauthorized (verified `(portal)/layout.tsx` has no checks).
- **[High] Missing Security Headers:** `next.config.mjs` does not configure headers like `X-Content-Type-Options`, `HSTS`, or `Content-Security-Policy`.
- **[High] Dependency Vulnerabilities:** `npm audit` exited with code 1, indicating vulnerabilities.

### ⚠️ Medium
- **[Medium] PII Logging:** `app/api/webhooks/outseta/route.ts` logs incoming payloads which may contain full names and emails.
    - *Risk:* PII leak in server logs.
- **[Medium] Hardcoded Plan Logic:** `app/api/ai/concierge/route.ts` contains hardcoded Plan UIDs (`zWZD0rQp`, `pWrBRnWn`) for bypassing checks.
    - *Risk:* Business logic fragility. If UIDs change, security/gating breaks.
- **[Medium] Client-Side Gating:** `AuthProvider` provides `hasAccess` for UI, but this can be bypassed.
    - *Mitigation:* Validated that `ai/concierge` enforces this server-side. **Must ensure ALL protected features do the same.**

### ℹ️ Low
- **[Low] Portal Layout Unprotected:** `app/(portal)/layout.tsx` renders the Sidebar without checking auth.
    - *Risk:* Info disclosure (menu items) to unauthenticated users if they guess the URL.

## 3. Detailed Review

### Authentication & Sessions
- **Status:** ✅ Mostly Secure
- **Mechanism:** Outseta token communicated via `Authorization` header or `outseta_access_token` cookie.
- **Cookie Settings:** `HttpOnly`, `Secure` (prod), `SameSite: Lax`. Excellent.
- **Session Route:** `POST /api/auth/session` validates token signature before setting cookie.

### API & AI Endpoints
- **Status:** ✅ Secure
- **Rate Limiting:** Implemented (10 req/min) per user.
- **Quota:** Server-side check `checkAIQuota` before execution.
- **Fail-Safe:** Usage is tracked *before* external API call to prevent free usage usage on error.

### Webhooks
- **Status:** ✅ Secure
- **Verification:** `verifyOutsetaSignature` correctly implements HMAC-SHA256.
- **Secret Management:** Enforces `OUTSETA_WEBHOOK_SECRET` in production.
- **Service Role:** Uses `SUPABASE_SERVICE_ROLE_KEY` safely in server environment.

### Database (RLS)
- **Status:** ✅ Secure
- **Policies:**
    - `users`: Users can only read/update their own records.
    - `firms/jobs`: read-only for authenticated, write-only for service role.
    - `entitlement_overrides`: No public access.

## 4. Remediation Plan (Launch Blocking)

| Severity | Item | Action |
| :--- | :--- | :--- |
| **High** | **Global Middleware** | Create `middleware.ts` to protect `/dashboard/*`, `/tools/*`, `/training/*` from unauthenticated access. |
| **High** | **Security Headers** | Add `headers()` config to `next.config.mjs`. |
| **High** | **Dependencies** | Run `npm audit fix` to resolve vulnerabilities. |
| **Med** | **PII Logging** | Remove `console.log(payload)` in webhook routes. |
| **Med** | **Hardcoded UIDs** | Move Plan UIDs to a shared constant/config file. |

## 5. Exploitation Steps (Proof of Concept)

1.  **Bypass Dashboard Auth:**
    - Navigate to `/dashboard` in Incognito.
    - **Result:** Page renders (likely empty or broken, but renders) because `layout.tsx` lacks checks.
    - **Fix:** Middleware redirect to `/login`.
2.  **View Logs (Internal/Admin):**
    - Trigger Outseta webhook.
    - **Result:** Full user details appear in Vercel/Server logs.

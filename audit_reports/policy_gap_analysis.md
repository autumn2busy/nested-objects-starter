# Policy Gap Analysis

## 1. Privacy Policy vs. Implementation

| Policy Claim | Actual Behavior | Status |
| :--- | :--- | :--- |
| "First-party cookies keep you signed in" | Outseta uses third-party cookies/storage scripts. | ⚠️ **Inaccurate** |
| "Limited analytics help us improve flows" | Detailed IP, User Agent, Referer are captured and stored in Supabase `profiles` via webhook. | ⚠️ **Disclosure Needed** |
| "Request deletion... subject to exceptions" | Manual process only. No automated endpoint. | ⚠️ **Operational Burden** |
| "Third-party processors" mentioned generally | Specific vendors (Outseta, Supabase) not explicitly named in the "Processors" list (only generic roles). | ℹ️ **Improvement** |

## 2. Terms & Conditions Alignment

*   **AI Disclaimers**: Terms mention "AI outputs are licensed", but strictly speaking, AI-generated content copyright is complex. The "No resale" clause is strong but might be hard to enforce on purely AI-generated text.
*   **Refund Policy**: "No refunds" is very strict. Ensure this is visible *at checkout* via Outseta's embed, not just on a hidden page.

## 3. Critical Compliance Gaps

### GDPR (EU Users)
*   **Missing Cookie Consent**: The `layout.tsx` loads Outseta immediately (`shouldLoadOutseta` check is only for production env/flag, not user consent). This violates GDPR "Prior Consent" rule.
*   **Data Portability**: No "Export My Data" button.
*   **Right to Erasure**: No "Delete Account" button.

### CCPA (California Users)
*   **"Do Not Sell My Info"**: Not present. While you claim "No resale", sharing data with vendors for "analytics" can sometimes be construed broadly. A clear "Do Not Sell/Share" link is recommended for safety.
*   **Notice at Collection**: The Privacy Policy link should be visible *inside* the Outseta signup form or immediately adjacent.

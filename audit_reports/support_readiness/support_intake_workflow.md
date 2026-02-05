# Support Intake Workflow

This document outlines the standard workflow for handling incoming support requests to ensure timely and accurate resolutions.

## 1. Intake & Triage
*   **Channels**: Email (support@...), In-App Widget (Outseta), Help Center Form.
*   **Initial Triage (Automated/Manual)**:
    *   **Keyword Scan**: "Login", "Billing", "Bug", "Refund".
    *   **User Tier Check**:
        *   **Elite/Agency**: Flag as **PRIORITY** (SLA: < 4 hours).
        *   **Pro**: Standard Queue (SLA: < 24 hours).
        *   **Starter/Free**: Standard Queue (SLA: < 48 hours).

## 2. Categorization
Assign the ticket to one of the following buckets:
1.  **Account Access**: Login failures, password resets, email verification.
2.  **Billing & Subscription**: Upgrades, downgrades, card failures, refund requests.
3.  **Technical/Bug**: Directory data errors, website glitches, AI tool failures.
4.  **Content/Training**: Questions about course material or directory firmness.
5.  **Feature Request**: Feedback and ideas for new tools.

## 3. Resolution Protocol

### Level 1: Self-Service & Canned Responses
*   Check if the issue is covered in the **Help Center**.
*   If yes, send the appropriate **Canned Response** with a link to the article.
*   *Goal: Resolve 70% of tickets here.*

### Level 2: Investigation & Troubleshooting
*   **Login Issues**: Verify user status in Outseta. Check for "suspended" or "expired" status. Reset password link if needed.
*   **Billing**: Verify Stripe status. If payment failed, send "Update Payment Method" instruction.
*   **AI Limits**: Check usage logs. If limit reached, explain the cap and offer upgrade.

### Level 3: Escalation (Engineering/Admin)
*   **Critical Bugs**: Site down, payment processing broken, severe data leak. -> **Escalate to Dev Team immediately via Slack.**
*   **Data Integrity**: Verified reports of incorrect firm data. -> **Escalate to Content Team for verification.**

## 4. Closing & Feedback
*   Confirm with the user that the issue is resolved.
*   Tag the ticket with the Resolution Code (e.g., "Educated User", "Fixed Bug", "Refund Processed").
*   Send a brief satisfaction survey (CSAT).

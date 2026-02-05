# Operator Runbook: Membership & Pricing Update

This runbook details the steps required to configure Outseta and the application to support the new "Free", "Starter", "Pro", "Elite", and "Agency" membership tiers.

## 1. Outseta Configuration

Log in to your Outseta dashboard (`Billing > Plans`) and create/update the following plans.

### **Plan 1: Free** (formerly Starter)
*   **Name**: Free
*   **Price**: $0
*   **Billing Term**: One-time / Forever
*   **Description**: "Directory preview (max 5 listings). Access to selected resources."

### **Plan 2: Starter** (formerly Directory)
*   **Name**: Starter
*   **Price**: $99
*   **Billing Term**: Every 3 months (quarterly)
*   **Description**: "Full Directory access for 90 days. No AI tools."

### **Plan 3: Pro** (New/Update)
*   **Name**: Pro
*   **Price**: $49
*   **Billing Term**: Monthly
*   **Trial Period**: **7 Days** (Critical for the "Start 7 Day Free Trial" flow)
*   **Description**: "The complete toolkit. AI tools, full training, and daily utility."

### **Plan 4: Elite** (Waitlist)
*   **Name**: Elite
*   **Price**: $99
*   **Billing Term**: Monthly
*   **Status**: You may create this now or later. The UI currently shows "Waitlist" / "Coming Soon".

### **Plan 5: Agency** (Waitlist)
*   **Name**: Agency
*   **Price**: $297
*   **Billing Term**: Monthly
*   **Status**: You may create this now or later. The UI currently shows "Waitlist" / "Coming Soon".

## 2. Update Application Config

Once the plans are created in Outseta, you will get a unique **Plan UID** for each. You must update these UIDs in the codebase.

1.  Open `apps/web-members/lib/plan-config.ts`.
2.  Replace the placeholder strings with your actual Outseta Plan UIDs:

```typescript
export const PLAN_UIDS = {
  FREE: 'REPLACE_WITH_FREE_UID',    // e.g. L9nbKV9Z
  STARTER: 'REPLACE_WITH_STARTER_UID', // e.g. zWZD0rQp
  PRO: 'REPLACE_WITH_PRO_UID',
  ELITE: 'REPLACE_WITH_ELITE_UID',
  AGENCY: 'REPLACE_WITH_AGENCY_UID',
}
```

## 3. Deployment

1.  Commit and push the changes to `lib/plan-config.ts`.
2.  Vercel will redeploy automatically.
3.  Verify the `/membership` page shows the correct buttons ("Start 7 Day Free Trial" for Pro).

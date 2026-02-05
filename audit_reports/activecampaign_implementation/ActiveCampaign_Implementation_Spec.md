# ActiveCampaign Implementation Spec for Nested Objects

## 1. Executive Summary

This document defines the strategy for implementing comprehensive email marketing and lifecycle automation for Nested Objects using ActiveCampaign (AC). The goal is to drive conversion, retention, and upsells through targeted, data-driven messaging.

## 2. Architecture & Integration Strategy

### Recommended Architecture: Hybrid Model

We will use a **Hybrid Architecture** to ensure robustness and data accuracy:

1.  **Lifecycle Events (Critical):** **Outseta Webhook -> n8n -> ActiveCampaign**
    *   **Why:** Decouples marketing logic from the core application. n8n handles retries, formatting, and API rate limits robustly. If the app goes down, marketing automation continues. Outseta sends webhooks for `Person Created`, `Subscription Updated`, `Account Updated`.
    *   **Flow:** Outseta fires webhook -> n8n Webhook Node -> Switch Logic (Event Type) -> ActiveCampaign "Create/Update Contact" Node.

2.  **Behavioral Events (Product Usage):** **Next.js App -> Next.js API Route -> ActiveCampaign API**
    *   **Why:** "Feature used" events (like `directory_search`) happen inside the app. Sending them directly to AC (via a robust proxy route) ensures real-time tracking of engagement.
    *   **Flow:** User performs action -> Client calls `POST /api/tracking/event` -> Server validates & attaches User Context -> Server calls ActiveCampaign `Event Tracking` API.

---

## 3. Event Model & Data Dictionary

### 3.1. Core Events (Lifecycle - via n8n)

| Event Name | Source | Trigger | Payload / AC Action |
| :--- | :--- | :--- | :--- |
| `signup_completed` | Outseta | New Account Created | Create Contact. Set Tags: `Status: Free` or `Status: Trial`. Set `Legacy: False`. Set `Source: [UTM]`. |
| `plan_changed` | Outseta | Subscription Update | Update Contact. Update `Plan UID`, `Plan Name`. Add/Remove Plan Tags (e.g., `Plan: Starter`, `Plan: Pro`). |
| `trial_started` | Outseta | Trial Subscription Created | Update Contact. Set `Trial End Date`. Add Tag `Stage: Trialing`. |
| `trial_ending_soon` | n8n (Timer) | 3 days before `Trial End Date` | *Calculated in AC* (Automation triggers based on Date field). |
| `payment_succeeded` | Outseta | Invoice Paid | Track Event `Payment Succeeded`. (Optional: Update `Renewal Date`). |
| `payment_failed` | Outseta | Invoice Payment Failed | Track Event `Payment Failed`. Add Tag `Status: Past Due`. Start Dunning Automation. |
| `cancellation_requested`| Outseta | Subscription Cancelled (End of Term) | Add Tag `Status: Cancel Pending`. |
| `cancelled` | Outseta | Subscription Expired | Add Tag `Status: Cancelled`. Remove Plan Tags. Start Winback. |

### 3.2. Behavioral Events (Product - via App API)

| Event Name | Source | Trigger | AC Event tracking |
| :--- | :--- | :--- | :--- |
| `directory_search` | Client | User filters/searches directory | Event: `Directory Search`. Value: Search Term (or "General"). |
| `ai_concierge_used` | Server | AI Chat completed | Event: `Feature Used`. Value: `AI Concierge`. |
| `ai_resume_used` | Server | Resume Export/Gen | Event: `Feature Used`. Value: `Resume Builder`. |
| `training_completed` | Client | User finishes a course | Event: `Training Completed`. Value: [Course Name]. |
| `login` | Outseta | User Logged In | Update `Last Login Date` field. |

### 3.3. ActiveCampaign Field Mapping

| AC Field Name | Type | Notes |
| :--- | :--- | :--- |
| `Plan Name` | Text | `Free`, `Starter`, `Pro`, `Elite`, `Agency` |
| `Plan UID` | Text | Outseta Plan UID (e.g., `L9nbKV9Z`) |
| `Member Type` | Dropdown | `Inspector`, `Firm`, `Training Only` |
| `Trial End Date` | Date | Synced from Outseta `Subscription.EndDate` when in trial |
| `Renewal Date` | Date | Next billing date |
| `Legacy Flag` | Text/Checkbox| `True` if migrated from legacy system |
| `Acquisition Source`| Text | `utm_source` captured at signup |
| `Acquisition Campaign`| Text | `utm_campaign` captured at signup |
| `Last Login Date` | Date | Updated mainly for engagement scoring |

---

## 4. Automation Strategy

### Phase 1: Core Lifecycle

#### 1. Welcome Series (Free)
*   **Trigger:** Tag `Plan: Free` added.
*   **Goal:** Activation. Get them to update profile and look at Directory preview.
*   **Stop Condition:** Upgrade to Paid.

#### 2. Activation Series (Starter)
*   **Trigger:** Tag `Plan: Starter` added.
*   **Goal:** Usage. "You have access to X, Y, Z."
*   **Flow:**
    *   Email 1: Welcome & Quick Start (Directory)
    *   Wait 2 days.
    *   Email 2: Value prop of Tools (Resume/AI).
    *   Wait 3 days.
    *   Check: If no `login` event -> "Need help?" email.

#### 3. Pro Trial Onboarding (The Money Maker)
*   **Trigger:** Tag `Stage: Trialing` AND `Plan: Pro`.
*   **Goal:** Conversion to Paid.
*   **Flow:**
    *   Immediate: "You're Pro! Here is everything you unlocked."
    *   Day 3: "Did you use the AI Concierge?" (Check event `ai_concierge_used`).
    *   Day 5: "Pro Tip: Firm outreach strategies."
    *   Day 6 (24h before trial ends): "Your trial ends tomorrow. Do nothing to stay Pro."

#### 4. Upsell: Starter -> Pro
*   **Trigger:** 
    *   Tag `Plan: Starter` is active for > 7 days.
    *   OR Event `directory_search` occurs > 5 times (High Intent).
*   **Goal:** Upgrade.
*   **Content:** "Unlock the full directory and AI tools."

#### 5. Winback
*   **Trigger:** Tag `Status: Cancelled` added.
*   **Goal:** Resubscribe.
*   **Flow:**
    *   Immediate: "Sorry to see you go. Exit survey?"
    *   Wait 14 days: "We missed you. Here is what is new."
    *   Wait 45 days: "Come back for 20% off month 1."

---

## 5. Technical Implementation Details

### 5.1. UTM Persistence
*   **Current State:** Outseta handles auth. We must ensure `utm_source` and `utm_campaign` are captured in the Outseta `Person` object during sign-up.
*   **Action:** Verify Outseta Sign-Up widget config to pass URL params to the created Person.
*   **Sync:** n8n webhook payload will include `Person.Referrer` or custom properties if configured. We map these to AC fields.

### 5.2. n8n Workflow (Webhook Receiver)
1.  **Webhook Node:** GET/POST from Outseta.
2.  **Filter:** Ignore events if `Person.Email` contains `@nestedobjects.com` (internal).
3.  **Switch:** Route based on `EventKey` (`Person.Created`, `Subscription.Updated`, etc.).
4.  **ActiveCampaign Node:** `Create/Update Contact`. Use Email as key. Map fields.
5.  **Tagging Logic:**
    *   If `Plan.Name` contains "Pro" -> Add Tag `Plan: Pro`. Remove Tag `Plan: Free`.

### 5.3. Next.js API Route (`/api/tracking/track-event`)
**Proposed Implementation:**
```typescript
// app/api/tracking/track-event/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getActiveCampaignService } from '@/lib/active-campaign'; // Wrapper we will build

export async function POST(req: NextRequest) {
  const { eventName, eventValue, email } = await req.json();
  
  // Security: Verify session via Outseta/Supabase token
  // ...

  try {
    await getActiveCampaignService().trackEvent(eventName, eventValue, email);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}
```

---

## 6. Testing Plan

### 6.1. Simulation Steps
1.  **Signup:** Open Incognito window with `?utm_source=test_simulation`. Sign up as free user.
    *   *Verify:* Contact created in AC. Tag `Plan: Free` present. `Acquisition Source` = `test_simulation`.
2.  **Upgrade:** Go to Billing, upgrade to "Pro Trial".
    *   *Verify:* Tag `Plan: Free` removed. Tag `Plan: Pro` added. Tag `Stage: Trialing` added. `Trial End Date` populated.
3.  **App Usage:**
    *   Visit Directory, search for "Florida".
    *   *Verify:* AC Contact Activity stream shows "Directory Search: Florida".
4.  **Cancellation:** Cancel subscription in Outseta.
    *   *Verify:* Tag `Status: Cancelled` applied (after period ends). Winback flow triggers.

### 6.2. Reports
*   Monitor "Automation Errors" in n8n.
*   Monitor `api_errors.log` in Next.js for failed event tracking.


# Product & UX Audit: Nested Objects

**Date:** 2026-02-05
**Scope:** Homepage, Membership, Directory, Tools, Training
**Focus:** Ad Traffic Conversion & Member Activation

---

## 1. Funnel Map: Visitor to Activation

### current Flow
1.  **Traffic Source** (Ads/SEO) -> **Homepage**
    *   *Primary Action:* "Compare Starter vs Pro" (Membership)
    *   *Secondary Action:* "Browse active firms" (Directory) / "Calculate Income" (Tool)
2.  **Engagement Layer**
    *   **Directory Preview**: View 6 firms -> "Upgrade for Full Access" (Membership)
    *   **Income Calculator**: **HARD GATE** (Login Required) -> Calculator. *High Friction.*
3.  **Conversion Layer (Membership Page)**
    *   Select Plan (Free, Starter, Pro) -> **Outseta Checkout**
4.  **Activation Layer (First Login)**
    *   **Dashboard** (Assumed based on global nav) -> **Tools/Directory**

### Funnel Gaps identified
*   **Leak:** The "Starter is free" message on Homepage is too small (`text-xs`). Users might bounce thinking it's paid-only.
*   **Leak:** Directory Preview (Guest) shows "Login to search" in the search bar. It should prompt to "Create Free Account" to capture email, not just "Login".
*   **Friction:** Tools page blurs cards heavily. Users can't see the *value* of the tool before being asked to join.

---

## 2. Top 15 UX Issues (Ranked by Conversion Impact)

| Rank | Issue | Location | Impact | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Ticker Trust Signal**: Homepage ticker says "LIVE DATA FEED" but data appears hardcoded/static. | Homepage | High | Connect to real Supabase feed or label as "Recent Highlights" to avoid loss of trust. |
| 2 | **Hidden Free Plan**: "Starter is free" is buried in small text footer or secondary split section. | Homepage | High | Make "Join for Free" a primary button alongside "View Plans" in the Hero. |
| 3 | **Directory Search Gate**: Search bar is disabled for guests with "Login to search". | Directory | High | Allow search but blur *results* after the first 3. Let them see *count* of matches (e.g., "54 firms found in Texas"). |
| 4 | **Tools Page Blur**: Entire tool cards are blurred, hiding the specific value prop of each tool. | Tools | Med | Unblur the *header* and *description* of the tool card. Only blur the "Open Tool" button or the bottom half. |
| 5 | **Static Map Image**: Directory map is a static JPG (`directory-map.jpg`). | Directory | Med | Replace with an interactive map (Leaflet/Mapbox) showing pins (even if vague locations) to prove coverage. |
| 6 | **Mobile Pricing Table**: Stacking 5 plan cards on mobile is an endless scroll. | Membership | Med | Use a tab switcher for "Starter / Pro / Agency" or a horizontal scroll snap for plans on mobile. |
| 7 | **Generic Hero CTA**: "Start Searching Free" is vague. | Homepage | Med | Change to "Find Field Work Now" or "View 300+ Hiring Firms". |
| 8 | **Lack of Social Proof on Directory**: No testimonials on the Directory page specifically. | Directory | Med | Add "Sarah found 3 clients here" testimonial directly above the firm list. |
| 9 | **Missing "Aha" in Onboarding**: User drops into Dashboard without a clear "First Win". | Board | High | Add a "Profile Completion Bar" or "Find your first firm" wizard immediately upon login. |
| 10 | **Color Contrast**: `brand-copper` text on white might be low contrast for some eyes. | Global | Low | darkening the copper shade for text elements to meet WCAG AA. |
| 11 | **Navigation Labeling**: "Membership" vs "Join". "Directory" vs "Firms". | Nav | Low | Test "Firms" instead of "Directory" for clearer value. |
| 12 | **Footer Links**: "Compare Starter vs Pro" link in Hero is text-only. | Hero | Low | Make this a secondary button style for better tap target on mobile. |
| 13 | **Income Calculator Gate**: Tool is fully gated behind login. Users bounce before seeing value. | Tool | High | Allow users to use the calculator *once* or show a dummy result before asking for email. |
| 14 | **Firm Card Noise**: Background blend mode on firm cards might visually clash with logos. | Directory | Low | Simplify card background to solid white/off-white to let firm logos pop. |
| 15 | **No Exit Intent**: No final attempt to capture email on exit. | Global | Low | Add exit modal: "Get the Top 10 Paying Firms PDF" in exchange for email. |

---

## 3. Copy Improvements

### Homepage Hero
*   **Current:** "See Who Is Hiring Now in Your Area."
*   **Better:** "The **#1 Job Board** for Independent Field Inspectors & Notaries."
*   *Why:* establishes authority immediately. "Hiring Now" is good but "Job Board" anchors the mental model.

### Membership CTA
*   **Current:** "Compare Starter vs Pro"
*   **Better:** "See Plans & Pricing" or "View Free & Pro Options"
*   *Why:* "Compare" sounds like homework. "View" sounds like browsing.

### Directory Teaser
*   **Current:** "Firms hiring field inspectors"
*   **Better:** "Verified Firms Hiring Active Inspectors"
*   *Why:* "Verified" adds trust. "Active" implies high volume.

### Tools Gate
*   **Current:** "Join to unlock all tools"
*   **Better:** "Get Instant Access to All 8 AI Tools"
*   *Why:* Quantifies the value (8 tools) and promises speed (Instant).

---

## 4. Alternate CTA Strategies (Ads Traffic)

### Strategy A: The "Free List" Lead Magnet
Instead of driving ads to Homepage:
*   **Landing Page:** "Get the list of Top 50 Firms in [User's State]."
*   **Action:** User enters Email -> Redirects to Directory (Filtered by State).
*   **Benefit:** Captures email first. User feels they "unlocked" data.

### Strategy B: The "Calculator" Hook
*   **Ad Copy:** "How much should you make as a Field Inspector?"
*   **Landing Page:** Direct to `tools/income-calculator`.
*   **Action:** User calculates -> Result says "You could earn $1,575/wk. See who pays this." -> Button to Directory.
*   **Benefit:** High intent. Money-motivated users.

### Strategy C: The "One-Click Apply" (Fake Door)
*   **Ad Copy:** "Apply to Safeguard, Amrock, and 100+ firms in one click."
*   **Landing Page:** "Common Application for Field Services."
*   **Action:** "Create Profile" (Signup) -> Dashboard says "Profile created. Now seeking matches."
*   **Benefit:** Reduces friction of applying to multiple sites. (Note: Must actually deliver on helping them apply).

---

## 5. Onboarding "Aha Moment" (First 5 Minutes)

**Goal:** User must feel "I am closer to getting paid" within 300 seconds.

**Recommended Steps:**
1.  **Step 0 (Signup):** Ask "What is your zip code?" during signup.
2.  **Step 1 (First Screen):** "Scanning for work in [Zip Code]..." (Fake loader/Animation 3s).
3.  **Step 2 (Result):** Show **3 Specific Firms** that hire in that zip.
    *   *e.g., "Found! Safeguard, Sandcastle, and Trinity work in 78701."*
4.  **Step 3 (Action):** "Save these firms to your Watchlist." (One click).
5.  **Step 4 (Success):** "Firms Saved. We will notify you if pay rates change."

**Why this works:** It delivers personalized value immediately. The user hasn't just "joined a site", they have "found work in their zip code".

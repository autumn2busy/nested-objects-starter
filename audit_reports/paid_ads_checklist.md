# Paid Ads Readiness Checklist

## 1. Conversion Tracking (CRITICAL)
- [ ] **Meta Pixel (Facebook/Instagram)**:
    - [ ] Install Base Code in `<head>`.
    - [ ] Create "Lead" Event for Sign Up (Thank you page or Button Click).
    - [ ] Create "Purchase" Event for Paid Plan Upgrade.
- [ ] **Google Ads Tag**:
    - [ ] Install Global Site Tag (gtag.js).
    - [ ] Configure Conversion Linker.
- [ ] **Verification**:
    - [ ] Use "Meta Pixel Helper" Chrome Extension to verify PageView fires.

## 2. Landing Pages
- [ ] **Audience Match**: ensure the Headline on the landing page matches the Ad Copy.
    - *Current*: "Find Field Inspection & Appraisal Jobs" (Good for general job seeker ads).
- [ ] **Speed**: PageSpread/Lighthouse score > 90 on Mobile.
- [ ] **Above the Fold**: Ensure the "Compare Starter vs Pro" or "Sign Up" button is visible without scrolling on iPhone.

## 3. Attribution
- [ ] **UTM Parameters**: Ensure all Ad URLs have `?utm_source=...&utm_medium=...&utm_campaign=...`.
- [ ] **Persistence**: Verify that Outseta captures these UTMs (it usually does automatically if script is loaded). Check New User record in Outseta to see if source is populated.

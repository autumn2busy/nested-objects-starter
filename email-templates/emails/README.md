# NESTED OBJECTS — Email Template Package
## ActiveCampaign Automation Sequences

> Historical template catalog only. Do not import, wire, schedule, or send these sequences from this guide. Current ActiveCampaign inventory, suppression, parity, approval, and rollout status lives exclusively in `docs/intelligence-os/issue-318-foundation-execution-ledger.md`.

**Generated:** February 12, 2026  
**Design System:** Techwear / Utility  
**Compatibility:** Gmail, Outlook (desktop + 365), Apple Mail, Yahoo, AOL, Samsung Mail, Dark Mode

---

## Quick Start

1. Open any `.html` file to preview in browser
2. Find-and-replace `{{site_url}}` with your production URL
3. Find-and-replace `{{outseta_checkout_link}}` with your Outseta Pro checkout URL
4. Find-and-replace `{{outseta_coupon_link}}` with your Outseta COMEBACK50 URL
5. Generate hero images using prompts in `IMAGE-PROMPTS.md`
6. Replace placeholder `<img src>` URLs with your hosted image URLs
7. Import HTML into ActiveCampaign templates
8. Wire automation triggers via n8n webhooks

---

## 18 Emails Across 6 Sequences

| Seq | Name | Trigger Tag | Emails |
|-----|------|-------------|--------|
| 1 | Welcome Series | `antigravity-subscription` | 5 emails (Day 0–7) |
| 2 | Onboarding Nudge | `onboarding-incomplete` | 3 emails (Day 3–8) |
| 3 | AI Intro (Pro) | `plan-pro` / `plan-elite` | 3 emails (Immediate–Day 5) |
| 4 | Upgrade Sequence | `plan-free` + membership visit | 3 emails (Immediate–Day 4) |
| 5 | Win-Back | `status-canceled` | 3 emails (Day 1–14) |
| 6 | Re-Engagement | 14 days inactive | 1 email |

See full details in the generated files and `IMAGE-PROMPTS.md`.

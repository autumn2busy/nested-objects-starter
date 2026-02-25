# Launch Files — Drop-in Replacement Instructions

**Date:** 2025-02-25
**Replaces:** All 5 patches (pricing-tier-restructure, token-gated-welcome, launch-hardening, testimonials, yt-testimonials-update)

## What's inside

These are the **complete, final versions** of every file changed across all 5 patches. Instead of applying patches (which fail when your local files have diverged), just copy these files into your project, replacing the existing ones.

### NEW files (create these — they don't exist in your repo yet):
```
apps/web-members/app/api/founders-token/route.ts    ← Token validation API
apps/web-members/app/welcome-back/WelcomeBackView.tsx  ← Founders landing page
apps/web-members/app/welcome-back/page.tsx           ← Suspense wrapper
apps/web-members/components/ContentProtection.tsx    ← Print/devtools blocker
apps/web-members/components/TestimonialsSection.tsx  ← Social proof component
apps/web-members/lib/testimonials.ts                 ← 19 curated testimonials
```

### MODIFIED files (replace the existing versions):
```
apps/web-members/app/(portal)/layout.tsx             ← Added ContentProtection
apps/web-members/app/api/webhooks/outseta/route.ts   ← Founders plan mapping
apps/web-members/app/hiring-firms/DirectoryView.tsx  ← Added no-select class
apps/web-members/app/membership-pricing/MembershipView.tsx ← Added testimonials
apps/web-members/app/page.tsx                        ← Added testimonials section
apps/web-members/components/auth-provider.tsx        ← Founders plan support
apps/web-members/lib/ai-datasets.ts                  ← Updated plan descriptions
apps/web-members/lib/ai-quota.ts                     ← Increased limits (50/10)
apps/web-members/lib/plan-config.ts                  ← Founders UID + tier mapping
apps/web-members/styles/globals.css                  ← Print protection CSS
```

## How to apply

### Option A: Manual copy (safest)
1. Open the `launch-files/apps/web-members/` folder from the zip
2. Copy each file into the matching path in your project
3. For MODIFIED files: replace the existing file entirely
4. For NEW files: create the directories if they don't exist

### Option B: Command line (from your project root)
```powershell
# Unzip launch-files.zip somewhere, then:
Copy-Item -Path "launch-files\apps\web-members\*" -Destination "apps\web-members\" -Recurse -Force
```

### After copying:
```bash
git add -A
git diff --cached --stat          # Verify the changes look right
git commit -m "feat: launch prep — pricing tiers, founders migration, content protection, testimonials"
git push                          # Triggers Vercel deploy
```

## What each feature does

### Pricing tier restructure
- Adds Founders plan UID (pWrBRnWn) to PLAN_ORDER
- Without this, ALL feature gates return false for Founders members
- Maps founders/starter plans to correct tier in webhook
- AC auto-tags as `plan-founders`

### Token-gated welcome page
- `/welcome-back?token=xxx` — personalized migration landing page
- `/api/founders-token` — validates (GET) and redeems (POST) tokens
- 5 states: loading, valid, no-token, invalid, redeemed

### Content protection
- Blocks right-click, Ctrl+P, F12, DevTools shortcuts
- Print CSS blanks the page
- `no-select` on directory content

### AI quota increase
- Concierge: 25 → 50 queries/month
- Resume: 3 → 10/month
- (Starter/Founders tier; Pro+ still unlimited)

### Testimonials
- 19 curated testimonials from Wix reviews, emails, chat, YouTube
- Full grid section on homepage and pricing page
- Stats bar: "5.0 avg rating · 19+ verified reviews · 100% real members"

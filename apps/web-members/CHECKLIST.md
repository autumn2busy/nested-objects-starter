# 🚀 Deployment Checklist

## Pre-Deployment (Local Setup)

### ☐ 1. Copy All Files
```bash
cd /path/to/your/apps/web-members

# Copy new components
cp /home/claude/components/auth-provider.tsx ./components/
cp /home/claude/components/gate.tsx ./components/

# Copy new lib
cp /home/claude/lib/auth-server.ts ./lib/

# Copy new app pages
cp /home/claude/app/page.tsx ./app/
cp /home/claude/app/auth/callback/page.tsx ./app/auth/callback/
cp /home/claude/app/upgrade/page.tsx ./app/upgrade/

# Updated files are already in /mnt/project/
```

### ☐ 2. Install Dependencies
```bash
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

### ☐ 3. Verify Files Copied
Check that these files exist:
- [ ] `components/auth-provider.tsx`
- [ ] `components/gate.tsx`
- [ ] `lib/auth-server.ts`
- [ ] `app/page.tsx`
- [ ] `app/auth/callback/page.tsx`
- [ ] `app/upgrade/page.tsx`
- [ ] `app/layout.tsx` (updated)
- [ ] `app/directory/page.tsx` (updated)
- [ ] `lib/feature-gate.ts` (updated)

---

## Vercel Configuration

### ☐ 4. Set Environment Variables

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add these **exact** values:

```bash
# Outseta (Client-Safe)
NEXT_PUBLIC_OUTSETA_DOMAIN=nested-objects.outseta.com

# Outseta (Server-Only - DO NOT use NEXT_PUBLIC_)
OUTSETA_API_KEY=11c56792e-3f19-489e-9106-914be2e9b66e
OUTSETA_API_SECRET=[PASTE YOUR SECRET FROM SCREENSHOT]

# Supabase (should already be set)
NEXT_PUBLIC_SUPABASE_URL=[YOUR_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_KEY]

# App URL
NEXT_PUBLIC_APP_URL=https://nested-objects-starter.vercel.app
```

**CRITICAL:** After adding env vars, click **"Redeploy"** button!

### ☐ 5. Verify Deployment
- [ ] Visit Vercel Deployments tab
- [ ] Wait for build to complete (2-3 minutes)
- [ ] Check for any build errors
- [ ] Confirm deployment is live

---

## Outseta Configuration

### ☐ 6. Set Redirect URLs

Go to: https://nested-objects.outseta.com/

**A) Auth Settings (AUTH → SIGN UP AND LOGIN)**
- [ ] Post Login URL: `https://nested-objects-starter.vercel.app/auth/callback`
- [ ] Click **Save**

**B) Content Protection (might be under Settings → Protected Content)**
- [ ] Access Denied URL: `https://nested-objects-starter.vercel.app/upgrade`
- [ ] Click **Save**

### ☐ 7. Verify Content Groups (Already Done ✅)
Go to: **Settings → Protected Content**

Confirm these exist:
- [ ] `ai_chatbot` → Pro, Elite, Agency
- [ ] `directory_access` → Starter, Pro, Elite, Agency  
- [ ] `job_intel` → Pro, Elite, Agency
- [ ] `priority_support` → Elite, Agency
- [ ] `white_label` → Agency

---

## Git Deployment

### ☐ 8. Commit & Push
```bash
git add .
git commit -m "feat: implement Outseta authentication with feature gates"
git push origin main
```

### ☐ 9. Wait for Auto-Deploy
- [ ] Vercel detects push
- [ ] Build starts automatically
- [ ] Check Vercel dashboard for progress
- [ ] Deployment completes successfully

---

## Testing (Post-Deployment)

### ☐ 10. Test Anonymous User Flow
1. [ ] Visit: https://nested-objects-starter.vercel.app/directory
2. [ ] See "Authentication Required" message
3. [ ] Click "Sign Up"
4. [ ] Outseta modal opens
5. [ ] Create test account (use temp email if needed)
6. [ ] Redirected to /auth/callback
7. [ ] Redirected to /directory
8. [ ] See firm directory list

### ☐ 11. Test Feature Gating
1. [ ] While logged in, visit: https://nested-objects-starter.vercel.app/ai_chatbot
2. [ ] Should redirect to /upgrade (if you're on Starter plan)
3. [ ] See pricing comparison
4. [ ] Current plan should be highlighted

### ☐ 12. Test Home Page
1. [ ] Visit: https://nested-objects-starter.vercel.app
2. [ ] See features grid
3. [ ] Click "Try AI Chatbot" link
4. [ ] Should show appropriate gate (login or upgrade)

### ☐ 13. Browser Console Check
Open DevTools → Console on each page:
- [ ] No JavaScript errors on home page
- [ ] No JavaScript errors on directory page
- [ ] No JavaScript errors on upgrade page
- [ ] Outseta script loaded successfully

### ☐ 14. Cookie Verification
Open DevTools → Application → Cookies:
- [ ] `outseta_access_token` exists after login
- [ ] Token is a valid JWT (check at jwt.io)
- [ ] Token contains `outseta:planUid` field

---

## Troubleshooting Checklist

### If users can't log in:
- [ ] Check Outseta Post Login URL is correct
- [ ] Check Vercel env vars are set
- [ ] Check browser console for errors
- [ ] Try incognito/private mode
- [ ] Check Outseta dashboard for user account

### If content gates don't work:
- [ ] Check plan UIDs match in code
- [ ] Check content groups in Outseta
- [ ] Verify JWT contains planUid (use jwt.io)
- [ ] Check browser console for hasAccess() errors

### If redirect loop occurs:
- [ ] Clear browser cookies
- [ ] Check /auth/callback page isn't throwing errors
- [ ] Verify Post Login URL in Outseta
- [ ] Check cookie is being set in callback

### If Supabase queries fail:
- [ ] Check RLS policies are enabled
- [ ] Verify Supabase env vars in Vercel
- [ ] Check firm data exists in Supabase
- [ ] Try query in Supabase SQL editor

---

## Success Criteria ✅

Phase 1 is complete when ALL of these work:

- [ ] Users can sign up via Outseta modal
- [ ] Users can log in via Outseta modal
- [ ] Directory shows firm list to Starter+ users
- [ ] AI Chatbot redirects Starter users to upgrade
- [ ] Upgrade page shows all 4 plans correctly
- [ ] Current plan is highlighted on upgrade page
- [ ] No console errors on any page
- [ ] JWT token stored in cookie after login
- [ ] Logout button works and clears token

---

## Post-Launch Tasks

### ☐ 15. Create Test Accounts
Create one account for each plan tier:
- [ ] test-starter@yourdomain.com (Starter plan)
- [ ] test-pro@yourdomain.com (Pro plan)
- [ ] test-elite@yourdomain.com (Elite plan)
- [ ] test-agency@yourdomain.com (Agency plan)

### ☐ 16. Document Plan UIDs
Save these somewhere secure:
```
Starter: L9nbKV9Z
Pro: rQVqlLm6
Elite: NmdnNO90
Agency: rmk5Xk9g
```

### ☐ 17. Monitor for Issues
- [ ] Check Vercel logs for errors
- [ ] Check Outseta webhook logs
- [ ] Watch for auth-related support questions
- [ ] Monitor signup/login success rates

---

## Optional: Seed Supabase Data

If you don't have firm data yet:

```sql
-- Run this in Supabase SQL editor
INSERT INTO public.firms (name, niche, location, pay_range, website, phone, email)
VALUES 
  ('ABC Inspections', 'Property Inspection', 'Los Angeles, CA', '$40-60/hr', 'https://example.com', '555-0100', '[email protected]'),
  ('XYZ Notary Services', 'Notary', 'New York, NY', '$50-75/hr', 'https://example.com', '555-0200', '[email protected]'),
  ('Field Services Pro', 'Occupancy', 'Chicago, IL', '$35-50/hr', 'https://example.com', '555-0300', '[email protected]');
```

---

## Need Help?

If stuck, check:
1. **DEPLOYMENT.md** - Detailed instructions
2. **IMPLEMENTATION_SUMMARY.md** - Quick reference
3. Browser console errors
4. Vercel deployment logs
5. Outseta dashboard logs

---

**Once all checkboxes are complete, Phase 1 is DONE! 🎉**

Next: Build AI Chatbot and Job Intel features (Phase 2)
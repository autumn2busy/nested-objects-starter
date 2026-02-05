# Nested Objects - Auth Implementation Deployment Guide

## ✅ What We Just Built

### New Files Created:
1. `components/auth-provider.tsx` - React Context for Outseta authentication
2. `components/gate.tsx` - Feature gating component with upgrade CTAs
3. `lib/auth-server.ts` - Server-side JWT verification utilities
4. `app/auth/callback/page.tsx` - Post-login redirect handler
5. `app/upgrade/page.tsx` - Pricing/upgrade page

### Files Updated:
1. `app/layout.tsx` - Added Outseta script and AuthProvider wrapper
2. `app/directory/page.tsx` - Fixed schema mismatches, added Gate component
3. `lib/feature-gate.ts` - Replaced stub with real auth logic

---

## 🚀 Deployment Steps

### Step 1: Copy Files to Your Project

Copy all the new files I created from `/home/claude/` to your actual project:

```bash
# From your project root (apps/web-members/)
cp /home/claude/components/auth-provider.tsx ./components/
cp /home/claude/components/gate.tsx ./components/
cp /home/claude/lib/auth-server.ts ./lib/
cp /home/claude/app/auth/callback/page.tsx ./app/auth/callback/
cp /home/claude/app/upgrade/page.tsx ./app/upgrade/
```

The updated files are already in place in `/mnt/project/`.

---

### Step 2: Set Environment Variables in Vercel

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Add these variables (replace with your actual values):

```bash
# Outseta
NEXT_PUBLIC_OUTSETA_DOMAIN=nested-objects.outseta.com
OUTSETA_API_KEY=11c56792e-[YOUR_FULL_KEY]
OUTSETA_API_SECRET=a6e1996c-[YOUR_FULL_SECRET]

# Supabase (you should already have these)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
NEXT_PUBLIC_APP_URL=https://nested-objects-starter.vercel.app

# Stripe (test mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SITE_URL=https://nested-objects-starter.vercel.app
```

**CRITICAL:** After adding env vars, click **"Redeploy"** from the Deployments tab.

---

### Step 3: Configure Outseta Settings

Go to: https://nested-objects.outseta.com/

#### A) Set Post-Login URL
1. Go to **AUTH → SIGN UP AND LOGIN**
2. Find **"Post Login URL"** field
3. Set to: `https://nested-objects-starter.vercel.app/auth/callback`
4. Save

#### B) Set Access Denied URL  
1. In the same page, find **"Access Denied URL"** (might be under Advanced Options)
2. Set to: `https://nested-objects-starter.vercel.app/upgrade`
3. Save

#### C) Verify Content Groups (Already Done ✅)
Your content groups are already configured:
- `ai_chatbot` → Pro, Elite, Agency
- `directory_access` → Starter, Pro, Elite, Agency
- `job_intel` → Pro, Elite, Agency
- `priority_support` → Elite, Agency
- `white_label` → Agency

---

### Step 4: Install Dependencies

Make sure you have the required npm package:

```bash
cd apps/web-members
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

---

### Step 5: Git Commit & Push

```bash
git add .
git commit -m "feat: implement Outseta authentication with feature gates"
git push origin main
```

Vercel will automatically deploy.

---

## 🧪 Testing Checklist

### Test 1: Anonymous User Flow
1. Go to: https://nested-objects-starter.vercel.app/directory
2. **Expected:** See "Authentication Required" message with Login/Sign Up buttons
3. Click "Sign Up"
4. **Expected:** Outseta modal opens
5. Create a test account on **Starter plan** (free)
6. **Expected:** Redirected to `/auth/callback` → then `/directory`
7. **Expected:** See firm directory list

### Test 2: Feature Gating
1. While logged in as Starter user, go to: https://nested-objects-starter.vercel.app/ai_chatbot
2. **Expected:** Outseta redirects you to `/upgrade` (Access Denied URL)
3. **Expected:** See pricing page with "Upgrade Required" message

### Test 3: Upgrade Flow
1. On `/upgrade` page, click "Select Plan" on Pro plan
2. **Expected:** Outseta profile modal opens to Subscriptions tab
3. Upgrade to Pro (use Stripe test card: 4242 4242 4242 4242)
4. After upgrade completes, try accessing `/ai_chatbot` again
5. **Expected:** You now have access (no redirect)

### Test 4: Server-Side Verification
1. Create an API route to test (example):
```typescript
// app/api/test-auth/route.ts
import { requireFeature } from '@/lib/auth-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = await requireFeature('directory_access')
    return NextResponse.json({ success: true, user })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 })
  }
}
```

2. Visit: https://nested-objects-starter.vercel.app/api/test-auth
3. **Expected:** JSON response with user data

---

## 🐛 Troubleshooting

### Issue: "Outseta is not defined"
**Cause:** Outseta script didn't load
**Fix:** Check browser console for errors. Make sure script URL is correct in `layout.tsx`

### Issue: Redirect loop after login
**Cause:** Cookie not being set properly
**Fix:** Check that your domain allows cookies. Try in incognito mode.

### Issue: "Authentication required" even after login
**Cause:** Token not stored or expired
**Fix:** 
1. Check browser DevTools → Application → Cookies → Look for `outseta_access_token`
2. If missing, check `/auth/callback` page is working
3. Check Outseta dashboard for valid subscription

### Issue: RLS blocking Supabase queries
**Cause:** Supabase RLS policies require authenticated user
**Fix:** For now, we're using anonymous Supabase client. To integrate JWT:
1. Pass Outseta JWT to Supabase client
2. Update Supabase policies to verify Outseta JWT claims
3. This is Phase 2 work

### Issue: Content groups not working
**Cause:** Outseta Quick Start script not monitoring DOM
**Fix:** Make sure `monitorDom: true` is in your `o_options` config (it's not in our current config - you can add it if needed)

---

## 📊 Expected User Flows

### Flow 1: New User Signup
```
1. User lands on /directory
2. Sees "Authentication Required"
3. Clicks "Sign Up"
4. Outseta modal opens
5. User fills form, selects Starter plan
6. Gets confirmation email
7. Clicks link, sets password
8. Redirected to /auth/callback?access_token=...
9. Token stored in cookie
10. Redirected to /directory
11. Sees firm list
```

### Flow 2: Existing User Login
```
1. User lands on /directory
2. Sees "Authentication Required"
3. Clicks "Log In"
4. Outseta modal opens
5. User enters credentials
6. Redirected to /auth/callback?access_token=...
7. Token stored in cookie
8. Redirected to /directory
9. Sees firm list
```

### Flow 3: Upgrade Required
```
1. Starter user tries to access /ai_chatbot
2. Outseta checks JWT planUid
3. Sees Starter doesn't have access
4. Redirects to /upgrade
5. User sees pricing comparison
6. Clicks "Select Plan" on Pro
7. Outseta profile modal opens
8. User upgrades via Stripe
9. Subscription updates
10. User can now access /ai_chatbot
```

---

## 🎯 Phase 1 Completion Criteria

- ✅ Outseta embed script loads
- ✅ Users can sign up/login
- ✅ JWT stored in cookie
- ✅ Gate component shows/hides content by plan
- ✅ Server-side JWT verification works
- ✅ Supabase queries work (with RLS)
- ✅ Upgrade page shows pricing
- ✅ Content groups protect URLs

---

## 🚧 Known Limitations (To Fix in Phase 2)

1. **JWT Verification:** Currently decoding without signature verification
   - TODO: Fetch Outseta's public key from `/.well-known/jwks`
   - TODO: Verify JWT signature using `jsonwebtoken` library

2. **Supabase + Outseta Integration:** Using separate auth systems
   - TODO: Pass Outseta JWT to Supabase client
   - TODO: Update RLS policies to read Outseta JWT claims

3. **No Refresh Token Handling:** Tokens expire after 7 days
   - TODO: Implement token refresh flow
   - TODO: Handle expired token gracefully

4. **Client-Side Storage Only:** Token in cookie is accessible to JS
   - TODO: Use HttpOnly cookies for better security
   - TODO: Implement CSRF protection

---

## 📞 Support

If you hit any blockers:
1. Check browser console for errors
2. Check Vercel deployment logs
3. Check Outseta dashboard for webhook/auth logs
4. Share the specific error message with me

---

## ✅ Success Metrics

Your auth implementation is working when:
- ✅ Users can sign up and login via Outseta modal
- ✅ Directory page shows firms to authenticated Starter+ users
- ✅ `/ai_chatbot` redirects Starter users to `/upgrade`
- ✅ Pro users can access `/ai_chatbot`
- ✅ Upgrade flow completes successfully
- ✅ No console errors on any page

**Once these work, Phase 1 is complete! 🎉**

---

## 🔒 Phase 2: Security Hardening

### 1. HttpOnly Cookies
- **Change**: Moved from client-side cookie access to HttpOnly server-side cookies.
- **Why**: Prevents XSS attacks from stealing the session token.
- **Mechanism**:
    - Login redirect -> `/auth/callback` -> POST `/api/auth/session` -> Sets HttpOnly cookie.
    - App load -> GET `/api/auth/session` -> Returns user context.

### 2. Server-Side Session Verification

### 3. Webhook Security
- **Strict Verification**: In production, `OUTSETA_WEBHOOK_SECRET` is now REQUIRED.
- **Mechanism**:
    - Validates `x-hub-signature-256` header (HMAC-SHA256).
    - Throws 500 if secret is missing in production.
    - Throws 401 if signature is invalid.
- **Idempotency**:
    - Checks `outseta_updated_at` against existing profile.
    - Skips update if payload is older or equal to stored version.

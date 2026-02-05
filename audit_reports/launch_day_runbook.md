# Launch Day Runbook

## 1. Pre-Flight Checklist (T-Minus 1 Hour)
- [ ] Verify Vercel Build is Green (Recent commit deployed).
- [ ] Verify `NEXT_PUBLIC_ENABLE_OUTSETA` is `true`.
- [ ] Verify Webhook Secret is set in Vercel Environment Variables.
- [ ] Test "Contact Support" widget on production URL.
- [ ] Submit a test Lead form (if applicable) and verify active campaign/email receipt.

## 2. Go-Live (T-Minus 0)
- [ ] Publish Ads (Turn Campaigns to Active).
- [ ] Send "We are Live" Email Blast.

## 3. Monitoring Checklist (T-Plus 1 Hour)
- [ ] **Vercel Logs**: Watch for `500` errors in the function logs.
- [ ] **Outseta Dashboard**: Watch for "Sign Ups" and ensure they appear in Supabase `profiles` table within ~10 seconds.
- [ ] **Ads Manager**: Verify "Page View" events are firing in Pixel Test Events tool.

## 4. Incident Response
### Scenario A: Webhooks failing (Profiles not creating)
1.  Check Vercel Logs for `POST /api/webhooks/outseta`.
2.  If `401 Unauthorized`: Rotate `OUTSETA_WEBHOOK_SECRET` in Vercel and Outseta.
3.  If `500 Error`: Check Supabase connection (Is the project paused? Is the service role key valid?).

### Scenario B: Site Down / Critical Bug
1.  **Immediate Rollback**: Go to Vercel Dashboard > Deployments > Click "..." on the previous successful deployment > "Promote to Production" (Target Rollback).
2.  **Communicate**: If users are impacted, post a status update (Twitter/Email).

### Scenario C: Ads not Tracking
1.  Inspect Network Tab in Chrome. Search for "facebook" or "pixel".
2.  If blocked, check AdBlocker presence.
3.  If missing code, Hotfiix `layout.tsx` and push to main. Vercel will deploy in ~2 mins.

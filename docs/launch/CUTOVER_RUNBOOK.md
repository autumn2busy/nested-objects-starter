# Cutover Runbook

## Scope
This runbook covers DNS cutover and verification for the `apps/web-members` Next.js application deployed on Vercel, using the build settings defined in `vercel.json`.

## Preconditions
- Production deployment is ready in Vercel.
- `NEXT_PUBLIC_SITE_URL` matches the intended production domain.
- Stakeholders have been notified of the cutover window.
- DNS TTL reduced ahead of cutover (recommended: 300s).

## DNS Cutover Steps
1. **Confirm target domain**
   - Verify the production domain is correct and aligns with `NEXT_PUBLIC_SITE_URL`.
2. **Update DNS records**
   - Update the apex A/AAAA records or CNAME to Vercel’s provided target per Vercel project settings.
   - Ensure both apex and `www` records are updated if applicable.
3. **Confirm Vercel domain verification**
   - Verify Vercel shows the domain as “Verified” and routed to the correct project.
4. **Log the change**
   - Record DNS change time, new target values, and expected propagation window.

## Verification Checks
Run these checks after DNS updates complete (and again after propagation):

### Application checks
- Load the home page and confirm rendering.
- Load `/directory` and confirm data loads.
- Authenticate via Outseta and verify the post-login redirect works.
- Validate gated routes for at least one protected feature (e.g., `/tools/ai-chatbot`).

### Configuration checks
- Confirm `NEXT_PUBLIC_SITE_URL` aligns with the new domain.
- Verify the `vercel.json` output directory points to `apps/web-members/.next`.

### Operational checks
- Review Vercel logs for build/runtime errors.
- Validate analytics/monitoring dashboards (if configured).

## Rollback Plan
1. **DNS rollback**
   - Revert DNS records to the prior target values.
   - Keep TTL low until stability is restored.
2. **Vercel rollback**
   - If the issue is deployment-related, promote the last known good deployment.
3. **Communication**
   - Notify stakeholders and support teams of rollback and expected resolution timeline.

## Post-Cutover Notes
- Document any incidents or anomalies.
- Update the risk register and follow-up tasks.

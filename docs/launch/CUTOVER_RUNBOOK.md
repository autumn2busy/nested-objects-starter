# Cutover Runbook

## Redirect Strategy

### Goals
- Ensure the production canonical domain is always `https://members.nestedobjects.com`.
- Preserve SEO equity from the Vercel preview domain and the legacy Wix site.
- Keep redirects centralized and easy to audit.

### Canonical domain enforcement
- `apps/web-members/lib/seo.ts` hard-codes the production canonical to `https://members.nestedobjects.com` when `NODE_ENV=production`.
- `app/robots.ts` and `app/sitemap.ts` rely on `SITE_URL` to emit canonical URLs.

### 301 redirects (Next.js)
Redirects live in `apps/web-members/next.config.mjs`.

**Domain-level redirect**
- `nested-objects-starter.vercel.app/*` → `https://members.nestedobjects.com/*`

**Legacy Wix path redirects**
These map known Wix-era routes to the current Next.js routes:
- `/about-us` → `/about`
- `/contact-us` → `/contact`
- `/privacy-policy` → `/privacy`
- `/terms-and-conditions` → `/terms-conditions`
- `/refunds` → `/refund-policy`
- `/vendor-hub` → `/directory`
- `/join` → `/membership`

### Operational checklist
- [ ] Verify Vercel environment has `NEXT_PUBLIC_SITE_URL=https://members.nestedobjects.com`.
- [ ] Confirm 301s for the Vercel preview domain and Wix routes using `curl -I`.
- [ ] Re-submit the sitemap in Google Search Console after cutover.


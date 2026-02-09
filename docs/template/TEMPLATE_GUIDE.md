# Template Guide: Resell & Reuse

Use this guide to customize and resell the platform for new tenants, brands, or
verticals. It focuses on configuration knobs, onboarding steps, and integration
points already present in the codebase.

## Integration Points to Rebrand

1. **SEO & metadata**
   - Centralized constants and schema builders live in `apps/web-members/lib/seo.ts`.
   - Update the site name, tagline, description, and default OpenGraph assets there.
2. **Global layout & scripts**
   - `apps/web-members/app/layout.tsx` wires in global metadata, structured data, and
     the Outseta script loader. Update domains, schema, and third-party snippets here.
3. **Server integrations**
   - API routes under `apps/web-members/app/api/**` connect to Outseta, Supabase,
     N8N workflows, and external data providers. These are the primary backend
     integration points for authentication, billing, and content ingestion.

## Configuration Knobs

### Environment variables

| Category | Examples | Purpose |
| --- | --- | --- |
| Site/SEO | `NEXT_PUBLIC_SITE_URL` | Canonical domain and metadata URLs. |
| Auth/Billing | `NEXT_PUBLIC_ENABLE_OUTSETA` | Toggle Outseta script loading. |
| Automation | `N8N_AI_CONCIERGE_WEBHOOK_URL` | Downstream webhook for AI concierge. |
| Data | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase connectivity for profile sync. |
| Security | Webhook signing secrets | Validate external webhooks. |

### Brand assets

- Replace static assets (logo, og-image, favicon) to match the new brand.
- Update messaging in marketing pages and FAQs to reflect the vertical you are selling.

### Subscription plans

- Align plan UIDs/tier names in Outseta with feature gates in API routes.
- Update pricing and tier descriptions in marketing pages and membership flows.

## Onboarding Steps for a New Resold Instance

1. **Clone & rebrand**
   - Update `apps/web-members/lib/seo.ts` with the new brand name, domain, and
     metadata defaults.
   - Refresh OpenGraph assets and logos.
2. **Configure environment**
   - Set `NEXT_PUBLIC_SITE_URL` and any Outseta toggles for the new deployment.
   - Provide Supabase credentials and webhook signing secrets.
3. **Provision third-party services**
   - Create an Outseta tenant for auth/billing and set the new domain.
   - Configure Supabase project and database schema.
   - Point N8N workflow URLs to the new automation environment.
4. **Validate API integrations**
   - Exercise key routes under `apps/web-members/app/api/**` (auth session, webhook
     syncs, concierge, jobs ingest) in a staging environment.
5. **Content review & compliance**
   - Update Terms/Privacy/Refund pages for the new operator.
   - Review PII flows and logging requirements for the target market.

## Reuse Patterns

- **Vertical swaps**: Replace marketing copy and job/industry taxonomy while keeping
  the auth/billing and member portals intact.
- **White-label deployments**: Use environment variables for domain changes and reuse
  the same app codebase with different Supabase/Outseta tenants.
- **Feature toggles**: Add per-tenant feature flags by gating API routes or UI modules
  with environment variables or subscription tier checks.

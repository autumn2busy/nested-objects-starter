# Launch Assumptions & Open Questions

## Explicit Assumptions
- The `apps/web-members` Next.js application is the production target.
- Vercel hosts the production deployment and honors the settings in `vercel.json`.
- `NEXT_PUBLIC_SITE_URL` is set in Vercel to the production domain.
- Outseta is the source of truth for authentication and plan gating.
- Supabase remains the primary data store for the directory experience.
- Stripe keys and plan configuration are valid for production.
- The AI concierge chat API route remains available for production traffic.

## Open Questions
1. What is the final production domain that should map to `NEXT_PUBLIC_SITE_URL`?
2. Is DNS managed in the same account as Vercel, or externally (e.g., Cloudflare, Route 53)?
3. Who is the primary on-call owner during the cutover window?
4. Are there any required data migrations or backfills before launch?
5. Which monitoring/alerting tools are required for launch-day visibility?
6. Is there a planned marketing announcement that impacts timing or traffic expectations?

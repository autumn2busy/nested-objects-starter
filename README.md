
# Nested Objects Starter (Members App)

This bundle includes:
- Supabase SQL schema + RLS policies + seed data
- TypeScript interfaces
- Next.js (App Router) starter with:
  - Outseta integration points (embed + JWT gate)
  - Supabase server client
  - `<Gate />` component
  - `/api/agents/concierge` (streaming chat route)

## Quick Start

1. Create Supabase project and run `infra/sql/schema.sql`, `infra/sql/policies.sql`, then `infra/sql/seed.sql`.
2. Configure Outseta products and embed. Ensure JWT is available to server (e.g., cookie `outseta_jwt`).
3. Set env vars in Vercel or `.env.local`:
   - OUTSETA_PUBLIC_KEY=
   - OUTSETA_WEBHOOK_SECRET=
   - SUPABASE_URL=
   - SUPABASE_ANON_KEY=
   - SUPABASE_SERVICE_ROLE_KEY=
   - OPENAI_API_KEY=
   - SHOPIFY_STORE_DOMAIN=
   - SHOPIFY_STOREFRONT_API_TOKEN=
4. `cd apps/web-members && npm i && npm run dev`

Security note: privileged writes should happen via serverless routes or n8n using the Supabase Service Role key. Keep it server-side only.

# Route-first architecture summary

## High-level folders
- `app/`: App Router pages for marketing (home, about, contact, partners/sponsors), membership/upgrade upsell, the protected directory, dashboard, and tools bundles. Layout and static assets (robots/sitemap) live here too.
- `components/`: Shared building blocks such as site chrome, auth Gate/AuthProvider, dashboard widgets, and UI primitives used across routes.
- `lib/`: Server utilities for auth verification, Supabase helpers, feature gating, and shared data types (for example the firm model).

## Major routes
- Marketing & membership: `/` (hero + membership CTAs), `/about`, `/contact`, `/partners`, `/sponsors`, `/membership`, and `/upgrade` pitch the product and plans.
- Directory: `/directory` exposes the firm search UI with filtering, Supabase-powered data pulls, and Outseta-gated access.
- Dashboard: `/dashboard` is the post-login hub shell that links members into tools and membership actions.
- Tools hub: `/tools` lists member utilities, with subroutes like `/tools/ai-chatbot` (AI concierge chat), `/tools/job-tracker`, `/tools/weather`, and `/tools/ai-resume` for workflow helpers.

## Where key logic lives
- Authentication: client session management in `components/auth-provider.tsx`, auth callback handling in `app/auth/callback/page.tsx`, and server-side token checks/feature rules in `lib/auth-server.ts` (shared plan gates with the Gate component).
- Directory experience: page-level search and Supabase fetch logic in `app/directory/page.tsx`, with shared firm typing in `lib/directory.ts` and presentation helpers like `components/FirmCard.tsx`.
- AI concierge: chat UI in `app/tools/ai-chatbot/page.tsx` with the `ChatWidget` client component, backed by the OpenAI relay API route `app/api/ai-chat/route.ts`.

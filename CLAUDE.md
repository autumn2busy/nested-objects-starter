# Claude Repository Guide

## Development Workflow
- **Development Server**: Always use `npm run dev` in the root or `cd apps/web-members && npm run dev`. Avoid `npm run build`.
- **HMR**: Ensure Hot Module Replacement remains functional. If it breaks, restart the dev server.
- **Dependencies**: After adding/updating dependencies, restart the dev server. Update lockfiles correctly.

## Tech Stack & Architecture
- **Framework**: Next.js 14+ (App Router).
- **Styling**: Tailwind CSS (Vanilla CSS preferred for custom components).
- **Backend**: Supabase (Database + Admin client for server-side tasks).
- **Auth**: Outseta (Handled via `components/auth-provider.tsx` and `lib/auth-server.ts`).
- **Marketing/CRM**: ActiveCampaign (Sync logic in `apps/web-members/lib/active-campaign-deep-data.ts`).
- **Monorepo Structure**:
  - `apps/web-members`: Primary platform and dashboard.
  - `apps/web-public`: Landing and public marketing pages.
  - `supabase/`: Database schema and seed scripts.

## Coding Standards
- **TypeScript**: Use `.ts`/`.tsx` for all new files. Defined types should be in `packages/types` or local `types/` folders.
- **Components**: Co-locate styles and specific utilities within the component folder when possible.
- **Design**: "Premium" aesthetic—vibrant HSL colors, dark mode support, smooth gradients, and micro-animations. Avoid generic browser defaults.
- **SEO**: Every page must have proper metadata, descriptive titles, and semantic HTML (`<h1>`, etc.).

## Key Commands
| Action | Command |
| :--- | :--- |
| Start Dev Server | `npm run dev` |
| Run Linting | `npm run lint` |
| Database Migration | Check `supabase/migrations/` for latest scripts |
| Sync AC Data | Use `lib/active-campaign-deep-data.ts` helpers |

## Integration Notes
- **Outseta**: Use `ProfileUpdateData` type for webhook handling.
- **ActiveCampaign**: Contacts are synced to list ID `12`. Plan tags follow `plan-[tier]` format.

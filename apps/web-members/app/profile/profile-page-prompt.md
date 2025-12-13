# /profile Page Generation Prompt

Design an enterprise-grade, SEO-optimized `/profile` page for a modern membership site powered by Outseta. Build it in Next.js/React with Tailwind CSS and treat the page as the member's control center. The experience should feel polished, responsive, and deeply integrated with the rest of the site (dashboard, directory, partners, tools, and training).

## Core goals
- Deliver a visually rich, accessible, and mobile-first layout that matches the site's brand system (gradients, elevated cards, subtle motion, dark/light themes).
- Keep the IA simple: hero summary, profile editor, billing + plan management, security, and connected resources. Make navigation sticky and scannable.
- Prioritize SEO: semantic headings, meta tags for profile ownership, structured data for person/org, and fast perceived performance (skeletons, progressive hydration, optimized images, aria labels).
- Keep everything interactive: tabs/accordions for sections, inline validation, optimistic saves, toast/alert feedback, skeleton loaders, and helpful empty states.
- Personalize: greet by name/email, surface last login, show plan badge, membership tenure, and quick links back to dashboard and directory.

## Outseta integration requirements
- Read/write profile fields: display name, headline, city/state, primary interest, tools, website, phone, LinkedIn, avatar, and rich bio. Persist via Outseta profile + structured notes.
- Full billing + subscription control: show active plan, renewal term, next billing date, payment method summary, billing address, and invoices. Provide upgrade/downgrade paths, plan comparisons, and proration notes.
- Account management: edit billing address, update card, change password, manage MFA, download data, and trigger secure logout. Provide hosted-portal fallbacks if widgets are unavailable.
- Member directory + B2B bio: preview how the bio appears to directory visitors and B2B clients; include toggles for visibility and completeness meter.
- File/image handling: upload/crop avatar with immediate preview and safe defaults (initials fallback). Enforce validation for URLs, phone numbers, and LinkedIn links.

## UX structure
1) **Hero overview**
   - Gradient banner with name, role/plan badge, location, last login, and CTA chips (Edit profile, Back to dashboard, Open billing).
   - Surface security status (MFA on/off) and quick links to update credentials.

2) **Left column (identity & support)**
   - Profile snapshot card with avatar upload, headline, location, and shareable public profile link.
   - Progress checklist (e.g., "Complete your bio", "Add service regions", "Connect LinkedIn").
   - Support/FAQs card: contextual links to docs, training, and contact.

3) **Right column (workspace tabs)**
   - Tabs: Profile, Billing, Security, Directory preview, Activity.
   - **Profile tab**: editable form with validation hints; inline save buttons and optimistic success states. Inputs for name, headline, city/state, primary interest, service areas, availability, tools, website, phone, LinkedIn, notes, and rich bio. Auto-sync avatar + headline with dashboard greeting.
   - **Billing tab**: live Outseta embed for subscription updates, plan change CTA with plan comparison, billing address form, payment method update, invoices table, and hosted portal fallback link.
   - **Security tab**: change password, enable MFA, session/device list with revoke controls, and logout everywhere.
   - **Directory preview tab**: side-by-side preview of how B2B clients and member directory see the profile; visibility toggles and completeness meter.
   - **Activity tab**: recent logins, plan changes, and support interactions for transparency.

4) **Global UX polish**
   - Friendly microcopy, inline error/success alerts, focus rings, keyboard navigation, and WCAG AA contrast.
   - Use cards, subtle shadows, and gradients; animate state changes with small transitions.
   - Provide fallback states when Outseta widgets fail: show alerts and link to hosted portal.

## Technical expectations
- Next.js app router with `use client` where needed; leverage Suspense and streaming-friendly components.
- Use shared UI primitives (`Card`, `Input`, `Tabs`, `Badge`, `Button`, `Alert`) and keep form state minimal with `useState`/`useTransition` or a lightweight form library.
- Debounce expensive calls; batch saves to Outseta; guard against missing `window.Outseta` by showing graceful loading and retry states.
- Include analytics hooks for critical actions (profile save, plan change, billing portal open, password update).
- Provide test IDs and ARIA labels for critical inputs and buttons to support QA automation.

## Tone and outputs
- Write clean, commented TypeScript/TSX with clear section headers.
- Favor reusable components for cards, forms, and previews; co-locate styles with components.
- Ensure copy is concise, confident, and supportive—this page is the member's command center.

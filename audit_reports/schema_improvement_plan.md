# Schema Improvement Plan
**Goal**: Obtain Rich Results (Stars, FAQ, Sitelinks) in Google SERPs.
**Status**: Good infrastructure with `@/lib/seo.ts`, but low adoption on actual pages.

## 🧱 Core Infrastructure (Already Exists!)
You have excellent helpers in `lib/seo.ts`:
- `getOrganizationSchema` (used in layout)
- `getWebSiteSchema` (used in layout)
- `getProductSchema` (unused)
- `getCourseSchema` (unused)
- `getLocalBusinessSchema` (unused)
- `getFAQPageSchema` (unused)
- `getBreadcrumbSchema` (unused)

---

## 🛠️ Implementation Plan

### 1. Global Breadcrumbs (High Impact)
**Why**: Helps Google understand site structure and displays breadcrumbs in SERP.
**Action**: Create a `SchemaBreadcrumbs` component that accepts path segments and renders the script.
**Target Pages**: All sub-pages (Directory, Roles, Tools, Resources).
```tsx
// components/SchemaBreadcrumbs.tsx
import { getBreadcrumbSchema } from '@/lib/seo'

export function SchemaBreadcrumbs({ items }) {
  const schema = getBreadcrumbSchema(items)
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}
```

### 2. "Product" Schema for Membership Pages
**Why**: Display price and "In Stock" status for memberships.
**Target**: `app/membership/page.tsx`
**Action**: Use `getProductSchema`.
```tsx
const starterSchema = getProductSchema({
  name: 'Starter Membership',
  description: 'Access to verified firm directory',
  price: '0.00'
})
const proSchema = getProductSchema({
  name: 'Pro Membership',
  description: 'Firm Intel & AI Tools',
  price: '29.00'
})
```

### 3. "Occupation" Schema for Role Pages
**Why**: Google Jobs integration (even if not a direct job post, it helps entity understanding).
**Target**: `app/roles/[slug]/page.tsx`
**Action**: Create a new helper `getOccupationSchema` in `lib/seo.ts`.
```typescript
{
  "@context": "https://schema.org",
  "@type": "Occupation",
  "name": "Mortgage Field Inspector",
  "estimatedSalary": { ... }
}
```

### 4. "Course" Schema for Training Modules
**Why**: Rich snippets for "Course" in results.
**Target**: `app/training/modules/[moduleId]/page.tsx`
**Action**: Use `getCourseSchema`.
```tsx
const courseSchema = getCourseSchema({
  name: 'Field Inspection Safety 101',
  description: 'Basic safety for roof and ladder work.',
  provider: 'Nested Objects'
})
```

### 5. "FAQ" Schema on Support Pages
**Why**: Take up more screen real estate in SERPs.
**Target**: `app/faqs/page.tsx` (or whatever the FAQ page is).
**Action**: Use `getFAQPageSchema`.

---

## 📅 Execution Order
1.  **Phase 1 (Launch Critical)**: Global Breadcrumbs + Organization (Done).
2.  **Phase 2 (Content Richness)**: Occupation Schema on Role Pages.
3.  **Phase 3 (Sales)**: Product Schema on Membership Page.
4.  **Phase 4 (Long Tail)**: Course Schema on Training pages.

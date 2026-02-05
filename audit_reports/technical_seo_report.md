# Technical SEO Audit & Fixes
**Date**: Feb 5, 2026
**Project**: Nested Objects Member Hub

## 1. Indexability

### 🔴 Critical: Missing `robots.txt`
**Finding**: The file `apps/web-members/public/robots.txt` is missing. Search engines may crawl everything or nothing depending on their default behavior, but it's best to be explicit.
**Fix**: Create `apps/web-members/public/robots.txt`:
```txt
User-agent: *
Allow: /

# Block private areas
Disallow: /dashboard/
Disallow: /api/

sitemap: https://nested-objects-starter.vercel.app/sitemap.xml
```

### 🟡 Warning: Sitemap is Static & Incomplete
**Finding**: `app/sitemap.ts` exists but manually lists only 8 static pages.
**Gap**: It misses all dynamic content:
- `/roles/[slug]` (Critical for ranking)
- `/training/modules/[moduleId]`
- `/tools/[toolId]`
- `/resources/[articleId]`
**Fix**: Update `app/sitemap.ts` to fetch dynamic routes:
```typescript
// app/sitemap.ts partial example
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ... static routes ...
  
  // Fetch roles
  // const roles = await getRoles()
  // const roleUrls = roles.map(role => ({ url: `${baseUrl}/roles/${role.slug}`, ... }))
  
  // return [...static, ...roleUrls]
}
```

### 🟢 Good: Canonical Tags
**Finding**: `metadataBase` is set in `app/layout.tsx`.
**Action**: Ensure `process.env.NEXT_PUBLIC_SITE_URL` is set to the production domain (`members.nestedobjects.com`) in your deployment environment, otherwise it defaults to the Vercel URL.

---

## 2. Metadata & Meta Tags

### 🟢 Good: Baseline Metadata
**Finding**: `app/layout.tsx` provides a strong default title template and description.

### 🟡 Warning: Keyword Optimization
**Finding**: Primary keywords "Field Inspector Directory" are NOT present in the Homepage title or description.
**Current**: `Nested Objects | Field Inspection, Notary & Appraisal Hub`
**Fix**: Update Homepage Title in `app/page.tsx`:
```typescript
export const metadata: Metadata = {
  title: 'Field Inspector Directory & Independent Vendor Hub | Nested Objects',
  // ...
}
```

### 🟠 Missing: Dynamic Page Metadata
**Finding**: `app/roles/inspector/page.tsx` has good metadata, but ensure *all* role pages have unique titles.
**Action**: Verify `app/roles/[slug]/page.tsx` dynamically generates metadata:
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const role = await getRole(params.slug)
  return {
    title: `${role.title} Jobs & Directory Profile`,
    description: `Find ${role.title} work...`
  }
}
```

---

## 3. Schema Markup

### 🟢 Good: Infrastructure Exists
**Finding**: `lib/seo.ts` has excellent helpers (`getOrganizationSchema`, `getWebSiteSchema`, `getFAQPageSchema`).

### 🔴 Critical: Unused Schema on Key Pages
**Finding**: `app/roles/inspector/page.tsx` does NOT use Schema.
**Impact**: Missing "Occupation" or "Product" rich snippets.
**Fix**: Inject schema in `app/roles/inspector/page.tsx`:
```tsx
// Inside component
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Occupation',
  name: 'Mortgage Field Inspector',
  estimatedSalary: {
    '@type': 'MonetaryAmountDistribution',
    currency: 'USD',
    median: '45000'
  },
  // ...
}
// Render <Script ... />
```

---

## 4. Internal Linking & Architecture

### 🟡 Warning: Navigation Labels
**Finding**: Navigation is functional, but labels could be more keyword-rich.
**Action**: Ensure `SiteHeader` links to `/directory` with anchor text that includes "Directory" (e.g., "Field Firm Directory" instead of just "Directory").

### 🟢 Good: Breadcrumbs
**Finding**: `lib/seo.ts` has `getBreadcrumbSchema`.
**Action**: Ensure this is actually IMPLEMENTED on deep pages like `/training/...` and `/roles/...` to help Google understand structure.

---

## 5. Duplicate Content & Subdomains

### 🟢 Risk: Low
**Finding**: Canonical tags are self-referencing by default which is good.
**Action**: Monitor Google Search Console after launch to ensure `www` vs non-www and `vercel.app` vs custom domain are consolidated.

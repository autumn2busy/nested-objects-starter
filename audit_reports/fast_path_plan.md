# Fast Path to Green (Performance Fixes)

## Immediate Actions (Top Priority)

### 1. Defer Third-Party Scripts (Impact: High)
**Goal:** Reduce TBT from 9s to <300ms.
**Action:**
-   Locate where `Outseta` is initialized (likely `layout.tsx` or a component).
-   Use `next/script` with `strategy="lazyOnload"`.
-   **Ideally:** Load it only when needed (e.g., when user clicks "Login" or "Sign Up"), or delay it by 5 seconds using `setTimeout`.

### 2. Prioritize LCP Image (Impact: High)
**Goal:** Reduce LCP from 3.8s to <2.5s on Membership page.
**Action:**
-   Identify the hero image on `/membership`.
-   Add `priority` prop to the `Next/Image` component.
-   Ensure it is not lazy-loaded.

### 3. Optimize `/members` Gating (Impact: Critical)
**Goal:** Fix 15s delay.
**Action:**
-   If `/members` is fetching data client-side, move it to Server Component (`async function Page()`).
-   Implement loading skeletons (`loading.tsx`) so the user sees *something* immediately while data fetches.
-   Add pagination or infinite scroll if fetching 1000+ members at once.

### 4. Remove Unused Shadcn/UI Components
**Goal:** Reduce bundle size.
**Action:**
-   Audit `components/ui` and remove unused files.
-   Ensure tree-shaking is effective (don't import `*`).

## Plan for Next 24 Hours
1.  [ ] **Fix Outseta Loading:** Move script to lazy load.
2.  [ ] **Fix Hero Images:** Add `priority` tags to landing pages.
3.  [ ] **Retest:** Run Lighthouse on `/membership` again. Target score >90.
4.  [ ] **Debug /members:** Profile the query performance.

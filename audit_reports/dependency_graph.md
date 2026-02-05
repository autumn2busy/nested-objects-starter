# Dependency Graph & File Touch Matrix

## Dependency Chains

1.  **Database & Schema Foundation**
    *   `AUD-DB-001` (Profiles Schema) -> `AUD-DB-004` (Indexes) -> `AUD-DB-003` (Directory RLS)
    *   `AUD-DB-003` (Directory RLS) -> `AUD-PER-001` (Directory Fetch) -> `AUD-PER-002` (Directory Filter)
    *   *Reasoning*: We must stabilize the table structure and access policies before optimizing the queries that run against them.

2.  **Security & Auth Foundation**
    *   `AUD-SEC-001` (Middleware) -> `AUD-UX-005` (Calculator Gate) / `AUD-UX-003` (Directory Search Gate)
    *   *Reasoning*: Middleware handles the enforcement. Changing gates in UX might rely on or conflict with middleware logic.

3.  **Analytics & Compliance**
    *   `AUD-CMP-001` (Cookie Banner) -> `AUD-ANA-001` (Ads Pixel)
    *   *Reasoning*: Pixels should ideally be controlled by the cookie banner (strict compliance), or at least verified to work together.

## File Touch Matrix (High Level)

| Module / Area | Involved Issues | Est. Files |
| :--- | :--- | :--- |
| **Infra / SQL** | `AUD-DB-001`, `AUD-DB-002`, `AUD-DB-003`, `AUD-DB-004`, `AUD-DB-005` | `infra/sql/*.sql` |
| **App Configuration** | `AUD-SEC-002`, `AUD-SEC-001`, `AUD-REL-001`, `AUD-CMP-001`, `AUD-SEO-001` | `next.config.mjs`, `middleware.ts`, `app/layout.tsx`, `public/robots.txt` |
| **Authentication & Webhooks** | `AUD-SEC-004`, `AUD-SEC-005`, `AUD-BIL-001` | `app/api/webhooks/outseta/route.ts`, `lib/plan-config.ts` |
| **Directory Feature** | `AUD-PER-001`, `AUD-PER-002`, `AUD-UX-003` | `app/members/page.tsx`, `app/members/MembersDirectoryView.tsx`, `lib/use-profile.ts` |
| **Marketing Pages** | `AUD-SEO-004`, `AUD-UX-001`, `AUD-UX-002`, `AUD-CMP-002` | `app/page.tsx`, `components/marketing/*.tsx`, `components/site-footer.tsx` |
| **Tools Feature** | `AUD-UX-005`, `AUD-UX-006` | `app/tools/*` |
| **QA / Tests** | `AUD-QA-001` | `tests/*` |

## Conflicts to Avoid
*   **Directory Overlap**: `AUD-PER-001` (Fetch), `AUD-PER-002` (Filter), and `AUD-UX-003` (Search Gate) all modify `app/members/*`.
    *   *Resolution*: Group these into a single "Directory Overhaul" phase or strictly sequence them (Data/Perf first, then UX).

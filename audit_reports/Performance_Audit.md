# Performance Audit & Index Recommendations

## 1. Slow Query Risk List

| Risk Level | Query/Operation | Location | Issue | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| 🔴 **High** | `getMembers` | `app/members/page.tsx` | **Unbounded Fetch**: Fetches *all* profiles with no `limit()`. As user base grows, this will crash the page and database. | Implement pagination (`range(0, 19)`) or infinite scroll. |
| 🔴 **High** | `profiles` filtering | `app/members/MembersDirectoryView.tsx` (implied) | **Client-Side Filtering**: If filtering happens in JS after fetching all rows, performance will degrade O(n). | Move filtering to Supabase query (`.eq()`, `.textSearch()`). |
| 🟡 **Medium** | `mapOutsetaToProfile` | `api/webhooks/outseta/route.ts` | **Serial Updates**: If huge batch comes in, processing might timeout. | Ensure webhook processing is idempotent and fast. Current logic looks fine for individual updates. |
| 🟡 **Medium** | `useProfile` | `lib/use-profile.ts` | **Multiple Fetches**: Renders might trigger redundant profile fetches. | Ensure `useEffect` dependency array is stable (looks okay currently). |

## 2. Index Recommendations

Missing indexes can cause high CPU usage and slow response times.

| Table | Column(s) | Reason | Recommendation Code |
| :--- | :--- | :--- | :--- |
| `public.profiles` | `user_email` | **Critical**: Used in `useProfile` and Outseta webhook lookup. | `create index idx_profiles_email on public.profiles(user_email);` |
| `public.profiles` | `created_at` | Used for sorting in Directory (`order=created_at.desc`). | `create index idx_profiles_created_at on public.profiles(created_at desc);` |
| `public.profiles` | `subscription_tier` | Likely used for filtering members by plan. | `create index idx_profiles_tier on public.profiles(subscription_tier);` |
| `public.firms` | `name` | Used for search (already in schema.sql but verify live). | `create index if not exists idx_firms_name on public.firms using gin (to_tsvector('english', name));` |
| `public.jobs` | `user_id` | Used for RLS policies ("own jobs"). | `create index idx_jobs_user_id on public.jobs(user_id);` |

## 3. Schema & Database Performance
- **Connection Pooling**: Next.js Server Actions/API routes create transient connections. Ensure Supabase Transaction Pool (PgBouncer) is used if traffic is high.
- **Unused Tables**: `public.users` (if deprecated) is dead weight.

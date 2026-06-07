# Nested Objects Member Blog Editorial Workflow

Scope: `members.nestedobjects.com/blog`

The member blog is first-party SEO and AEO content for inspectors, contractors, and field service operators. It is separate from the RSS-based Industry News page and separate from any future B2B content on `firms.nestedobjects.com`.

## Publication Gate

Posts live in `apps/web-members/lib/blog.ts`.

Only posts with all of the following are public:

- `status: 'approved'`
- `review.approvedBy`
- `review.approvedAt`

Approved posts are included in:

- `/blog`
- `/blog/[slug]`
- `/blog/category/[category]`
- `sitemap.ts`
- Article schema
- FAQ schema when the post has FAQs

Draft, review, and archived posts are intentionally hidden from public routes and sitemap output.

## Preview Route

Use this route to review any non-archived post before publishing:

`/blog/preview/[slug]`

Example:

`/blog/preview/how-field-inspectors-can-build-a-profitable-weekly-route`

The preview route:

- renders draft, review, and approved posts
- uses the same article layout as the live post route
- adds `noindex, nofollow` metadata
- is excluded from sitemap output
- shows a preview banner with the current post status

It is not an authentication gate. Anyone with the exact preview URL could view the content, although search engines are instructed not to index it.

## Review Dashboard

Use this private dashboard to see the post queue:

`/blog/review`

The review dashboard:

- is gated behind the member app login
- allows users with admin claims, `ADMIN_OUTSETA_IDS`, `BLOG_REVIEWER_EMAILS`, or known owner emails
- lists draft, review, approved, and archived posts
- links to each post preview
- links to the live article only when a post is approved
- explains the manual approval fields to update in `apps/web-members/lib/blog.ts`

This dashboard is currently read-only. It helps the owner review and approve posts, but it does not write approvals back to the repo or database.

## Review Checklist

Before setting a post to `approved`, confirm:

- The post answers a real inspector/member search intent.
- The article contains first-party Nested Objects context or operational judgment.
- The content does not copy syndicated RSS or scraped article body text.
- The article links internally to relevant member-side routes.
- Claims about pay, compliance, vendors, or legal requirements are conservative and reviewable.
- The article includes an AEO-style direct answer where useful.
- The human reviewer has added, corrected, or approved the final language.

## Content Boundaries

Use the member blog for:

- Field inspection strategy
- Route operations
- Property preservation basics
- Firm application strategy
- Member tools and training context
- Inspector-facing AI workflows

Do not use the member blog for:

- B2B firm acquisition content
- Generic corporate announcements
- Duplicated root-domain guide content
- RSS headline reposts

Future `web-firms` content should use a separate B2B topic map and should not duplicate member blog posts.

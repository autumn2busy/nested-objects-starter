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

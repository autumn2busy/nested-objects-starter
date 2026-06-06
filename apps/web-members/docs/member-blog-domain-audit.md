# Nested Objects Member Blog Domain Audit

Date: 2026-06-05

## Domain Roles

- `members.nestedobjects.com` (`apps/web-members`): B2C inspector/member acquisition, conversion, tools, directory, training, and member SEO.
- `nestedobjects.com` (`apps/web-public`): Root brand site and routing layer for the overall Nested Objects business.
- `firms.nestedobjects.com` (`apps/web-firms`): Future B2B firm/operator acquisition surface.

## Current Content Inventory

`apps/web-public` has 23 MDX guide articles under `content/guides`.

`apps/web-members` had 3 guide pages before this phase:

- `/guides/how-to-become-a-field-inspector`
- `/guides/field-inspection-vs-home-inspection`
- `/guides/list-of-field-inspection-companies`

This phase added the member-side owned blog:

- `/blog`
- `/blog/how-field-inspectors-can-build-a-profitable-weekly-route`
- `/blog/mortgage-field-inspection-vs-property-preservation`
- `/blog/how-to-choose-field-inspection-companies-to-apply-to`
- `/blog/category/route-operations`
- `/blog/category/property-preservation`
- `/blog/category/firm-growth`

## Overlap Risk

The main exact slug collision is:

- `web-public/content/guides/how-to-become-a-field-inspector.mdx`
- `web-members/app/guides/how-to-become-a-field-inspector/page.tsx`

This creates a likely split-ranking and canonical ambiguity risk because both pages target the same search intent with similar title/description patterns.

The new member blog does not duplicate the root-domain MDX guide slugs. Its posts are narrower operational articles designed to internally link into member-side conversion routes.

## Recommendation

Use `members.nestedobjects.com` for inspector-facing SEO that should convert into membership:

- route planning
- firm applications
- field inspection pay and operations
- preservation basics
- tools, training, directory, and role pages

Use `nestedobjects.com` as the root brand/routing site. It can summarize high-level resources, but should link to member blog articles rather than duplicate them.

Use `firms.nestedobjects.com` later for B2B content:

- hiring inspector networks
- vendor quality
- coverage gaps
- compliance workflows
- firm profile claiming
- contractor reputation and operations

## Next SEO Cleanup

Decide canonical ownership for `how-to-become-a-field-inspector`.

Preferred path: make `members.nestedobjects.com/guides/how-to-become-a-field-inspector` the primary canonical because it is closer to the paid member conversion path, then make the root-domain version either:

- a short brand-level summary linking to the member guide, or
- canonicalize to the member guide if cross-domain canonical support is desired.

Avoid duplicating the new member blog posts on root or firms domains.

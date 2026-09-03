# Free directory offer accuracy and conversion priority

> **Superseded for current status on 2026-09-03.** Preserve this as PR #342's dated evidence only. Current status, ownership, and remaining work live in the [canonical execution ledger](issue-318-foundation-execution-ledger.md).

Date: 2026-09-02
Branch: `codex/free-directory-offer-clarity`
Base: `a7d3161df6f8daf4f605ad715beb5b8b88d24a29` (main after #341)
Scope: customer-facing correction and Preview PR. No merge, Production configuration/deployment, database changes, account creation, payment submission, or marketing sends.

## Verified mismatch

The live homepage and source promised searching firms near the visitor, labeled directory search "Included with Free", and implied profile-based location matching. The actual `/hiring-firms` directory limits Free to up to three sample cards plus four sanitized, locked teasers. Search, filters and pagination are unavailable to Free. The teasers are not additional accessible listings, and the sample is not matched to a location or inspection type.

Public Pro, Elite and Agency include directory search/filtering and detailed firm intel. Legacy plans retain their existing access; no entitlement predicate changed. Public state guides are a separate surface with preview information, not Free directory filtering. The correction does not claim that all public firm information is private.

## Correction

- Lead the homepage with paid directory research and plan comparison. Keep direct Free registration as an explicitly limited sample, not a full-search offer.
- State up to three sample listings and no search/filters at all four homepage Free CTAs, in the visible FAQ and matching structured data, and in the welcome/dashboard guide.
- Remove unsupported exact-ZIP/job-matching claims, the explicitly dummy live ticker, and the separate unsourced 500+/earnings/results block. Retain the existing sourced testimonial library.
- Align the directory access banner and locked-card handoff with that offer. Remove the retired $37/year offer and unavailable AI-matching promise; link to current plans instead of duplicating prices.
- Preserve native Free registration, signed-in dashboard routing, loading protection, existing event names/payloads, prices, auth, server-side directory restrictions, profile privacy, and all paid/legacy entitlements.

## Verification

- 96 actual-source synthetic regression cases passed across auth/login, provider races, profile privacy, onboarding, homepage, directory, guide discovery, and pricing, including the final guide-copy assertions. Final lint and TypeScript reruns passed.
- Directory coverage executes the actual server route with intercepted synthetic requests: guest/Free URL filters are neutralized, only the three sample cards retain detail, four teasers stay sanitized, and paid/legacy filter/pagination behavior is unchanged.
- Lint, TypeScript, member-surface audit and the 18-case Free-to-Pro source audit passed. No production build was run, per AGENTS.md.
- Browser: confirmed the mismatch on the live homepage read-only; verified corrected local desktop and 390px iframe presentation, four hydrated Free URLs, visible keyboard focus, and navigation from the primary comparison link to pricing. No registration/checkout submission occurred.
- Local testing used process-only synthetic database settings and the existing Preview/admin tracking suppression. Google font downloads were sandbox-blocked; screenshots used the fallback font. Initial navigation timed out during compilation, then the page and session endpoint returned 200 with no framework error overlay. The temporary mobile fixture was removed.
- Real-member Preview acceptance, full signup/payment/confirmation delivery, and actual conversion outcomes are not claimed as tested. Recheck the configured font and an authorized existing member session on Preview before release.

## Conversion evidence and next bounded check

The promise mismatch is verified; its contribution to lost sales is a hypothesis, not a measured causal conclusion. No live member cohort or billing records were queried for this correction.

Reuse the existing conversion ledger for a bounded read-only review. Do not add another event system or make signup count the success metric. Measure completed Free registrations, directory/sample exposure, paid-plan intent, and verified settled payments with explicit denominators and attribution coverage. Compare like-duration, same-source cohorts with equal time to convert; report unstitched identities separately.

Current reporting caveats requiring attention before treating its labels as revenue truth:

- `conversion-funnel.ts` counts stages independently after signup; adjacent count differences do not prove an ordered abandonment path. Its cohort is signup actors in the fetched window, not all visitors or Free members. Homepage `join_free_click` is not a report stage.
- `DirectoryActions.tsx` records both `directory_viewed` and the Free preview `paywall_hit` on page mount. These are exposure signals, not proof of useful search or attempted purchase.
- `free-to-pro-lifecycle.ts` decides paid events from plan/tier changes, not payment settlement. A paid-tier trial must not be equated to collected revenue. The public event ingestion allowlist and funnel provenance rules also need a focused review; no live contamination was established here.
- Checkout/modal events include Free selection or login in some paths; distinguish actual paid checkout intent. The current report's 20,000-event cap and identity stitching can limit completeness.

Priority after release: reconcile a bounded signup cohort with authoritative billing evidence, then address the largest verified conversion break. Database/Production holds remain in effect; no automation, email sequence, offer experiment, or firm-side feature is activated by this PR.

Unrelated privacy SQL/runbook edits, audit/workplan files, and vendor-opportunity work remain excluded and untouched.

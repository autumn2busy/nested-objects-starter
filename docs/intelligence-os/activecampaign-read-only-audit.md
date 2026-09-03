# ActiveCampaign read-only audit. Phase C input

> Superseded for current status, ownership, decisions, and next actions by `docs/intelligence-os/issue-318-foundation-execution-ledger.md`. This file remains dated technical evidence only and is not a competing implementation plan.

Audit date: 2026-08-25

## Purpose

This record captures architectural findings from a read-only inspection of the dedicated Nested Objects ActiveCampaign environment. It deliberately excludes contact email addresses, message content, credentials, and a complete export of account assets because this repository is public.

## Findings

The account contains a mixture of current Nested Objects lifecycle assets, Wix-era member markers and fields, large imported cold-prospect cohorts, internal-domain and demonstration contacts, legacy non-Nested Objects assets, generic test assets, duplicate or ambiguous taxonomy, and membership-looking tags that cannot be trusted as product authority.

The main inspector audience is materially larger than the authoritative current-member population. Therefore list membership and broad tags cannot serve as a member count.

Custom-field quality issues include duplicate Wix subscription fields, overlapping state and location fields, malformed dropdown choices, generic test values, duplicate timezone concepts, legacy integration fields, and fields that appear sensitive or operationally inappropriate for broad marketing use.

## Immediate policy

- No cleanup writes are authorized by this audit.
- ActiveCampaign contacts are classified against Outseta and Supabase truth before any recommendation is made.
- Internal, test, cold-import, Wix-era, and unknown contacts are excluded or quarantined from member and revenue analysis as appropriate.
- Existing current members remain members even when stale cold or Wix tags are attached.
- Stable asset IDs must be reviewed by Autumn before being added to the read allowlist.
- All asset mutations remain disabled.
- A suppression candidate is not automatically unsubscribed or deleted.

## Cleanup sequence

1. Establish canonical member identity from Outseta and Supabase.
2. Classify ActiveCampaign contacts without changing them.
3. Build a private owner review queue for contacts and assets.
4. Identify lifecycle conflicts and overlapping automations.
5. Propose a taxonomy consolidation plan.
6. Test proposed cleanup on staging or synthetic records.
7. Execute one narrowly scoped, explicitly approved cleanup action at a time.
8. Measure deliverability, engagement, conversion, and false-positive impact after each action.

## High-priority review cohorts

- Authoritative current members with conflicting marketing plan state.
- Paid members missing onboarding or correct access.
- Canceled members still present in paid nurture.
- Free members with no usable product or lifecycle evidence.
- Wix-era contacts without a canonical Vercel member identity.
- Cold imports with no observed opens, clicks, or site activity.
- Internal-domain and test contacts in member-facing lists or automations.
- Legacy assets that can trigger current Nested Objects automations.

## Non-goals

This audit does not label every old contact as disposable. It does not assume that an email open proves intent, that no open proves disinterest, or that an ActiveCampaign plan tag proves membership. It creates the evidence needed for a defensible cleanup decision.

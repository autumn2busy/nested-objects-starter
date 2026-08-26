# Issue #318 Phase C. Projections, lifecycle integrity, and marketing classification

Branch: `feature/318-phase-c-projections-lifecycle-integrity`

Base commit: `59b6a4ae8c95c594479b10e2bea2f7a06373ef7b`

## Scope

This increment turns the Phase B contracts into deterministic projection and integrity logic without enabling autonomous marketing or production mutations.

It adds canonical member projection plans from Supabase `profiles` and the existing `conversion_events` ledger, collision detection, explicit membership authority snapshots, operational member projections, daily metrics, lifecycle integrity signals, read-only ActiveCampaign classification, private registries, and idempotent server-only persistence.

## Data authority

- Outseta-originated account and subscription state remains the highest-ranked membership authority.
- Supabase `profiles` remains the application projection and a lower-ranked authoritative snapshot.
- ActiveCampaign remains a marketing and lifecycle mirror. It cannot establish membership ownership, product entitlements, churn, MRR, or ARR.
- Revenue values remain unknown until a billing-grade authoritative source is connected.

## Canonical projection behavior

The projector uses the Supabase profile UUID as the initial canonical member key. It links Supabase profile and user IDs, Outseta person and account IDs, email when it is not in conflict, and anonymous conversion IDs that later resolve to the profile.

A shared identifier attached to multiple profiles is not silently merged. The affected canonical members are marked `conflict`, and unsafe email, Outseta person, or Outseta account links are withheld so the database cannot persist the same stable external identity to multiple members. Lifecycle signal fingerprints hash the conflicting identifier instead of placing the raw value in a durable signal key.

Repeated conversion deliveries are deduplicated by `client_event_id`. Browser and authoritative Outseta signup events are deduplicated by actor for daily signup metrics. Unmatched events remain visible as an integrity signal rather than disappearing from the analysis.

Daily metric idempotency keys are stable across projection reruns. A retry updates the same metric-day contract rather than creating a second row merely because the workflow run ID changed.

## ActiveCampaign cleanup boundary

The connected ActiveCampaign account was inspected through read-only tools. The audit confirmed substantial overlap among current Nested Objects assets, Wix-era data, cold imports, internal contacts, test assets, and legacy non-Nested Objects assets.

No raw contact email, message content, API credential, or complete asset inventory is committed to this public repository.

Authoritative product membership outranks marketing tags. A current member is not demoted to a cold contact merely because an old import or Wix tag remains attached.

The private ActiveCampaign asset registry is deny-by-default. Candidate classification does not grant access. Read access requires an owner-approved `nested_objects` classification. Mutation access is blocked by a database check in this increment. Stable external IDs, not names alone, become the future allowlist keys.

A suppression candidate is only a recommendation. The runtime does not unsubscribe, delete, retag, merge, enroll, or email contacts.

## Daily metrics

The first deterministic metrics include signups by tier, confirmed subscription creation and upgrade events, confirmed purchases, directory and firm views, paywall hits, upgrade clicks, profile completions, training starts and completions, and a current active-trial snapshot.

MRR, ARR, and cancellation counts remain `unknown` because current inputs do not provide billing-grade amounts or an authoritative cancellation event. Unknown values remain `NULL` rather than zero. Unknown MRR and ARR use currency units, while unknown cancellation counts use a count unit.

## Safety boundaries

This increment does not apply a production migration, backfill production members, change ActiveCampaign, send email, enable an external mutation executor, deploy the runtime, create the Vercel project, call an OpenAI model, or merge its own pull request.

## Staging rollout

1. Review the migration and runtime changes.
2. Apply `20260826090000_create_phase_c_projection_and_marketing_registry.sql` to Supabase staging.
3. Run `20260826_validate_phase_c_projection_and_marketing_registry.sql` in staging.
4. Confirm the rollback-safe validation returns `PASS`.
5. Compare projection output with the existing conversion command center and old reports for one parity cycle.
6. Add a preview-only entry point in the next increment before creating the separate Vercel project.

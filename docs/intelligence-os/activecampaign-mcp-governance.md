# ActiveCampaign and MCP governance decision

Status: Confirmed by Autumn for Issue #318

## Purpose

The connected ActiveCampaign account is the dedicated marketing operations environment for Nested Objects. It is not a disposable test account. Existing non-Nested Objects assets are treated as legacy records and must remain outside Intelligence OS reads, measurements, recommendations, and mutations unless Autumn explicitly approves a cleanup or migration action.

## Authority model

ActiveCampaign is the marketing execution, lifecycle delivery, engagement, segmentation, campaign reporting, automation reporting, and marketing CRM layer.

ActiveCampaign is not authoritative for:

- Membership ownership
- Product entitlements
- Subscription status
- Churn status
- Billing amounts
- MRR or ARR

Outseta remains the upstream membership and entitlement authority. Supabase remains the application projection and shared operational memory. A future verified Stripe synchronization may become authoritative for payment and billing amounts.

Conflicts between ActiveCampaign and authoritative membership sources must produce an intelligence signal. They must not be silently resolved by trusting a tag, custom field, automation state, ecommerce record, or recurring-payment mirror in ActiveCampaign.

## Connector role

The ActiveCampaign ChatGPT connector and future Codex MCP connector are governed tool adapters inside the Intelligence OS. They are not independent sources of truth and they do not bypass the control plane.

Connector capabilities may support:

- Read-only campaign and automation reporting
- Contact and segment analysis
- Marketing engagement analysis
- Draft recommendations
- Draft campaign creation
- Draft copy creation
- Contact, list, tag, field, deal, campaign, and automation management after policy evaluation

Every connector request must carry correlation, causation, idempotency, actor, and approval context when applicable.

## Approval policy

Autumn is the sole consequential-action approver for the initial release. A future delegated approver, expected to be Autumn's son, must be represented through an explicit approver record and scoped permissions. Delegation must never be inferred from account access alone.

Read-only and analytical connector operations may run without approval when they stay inside the approved allowlist.

The following ActiveCampaign operations require an `agent_actions` proposal and Autumn's explicit approval before execution:

- Sending or scheduling a campaign
- Creating or initiating cold outreach
- Editing a live campaign
- Starting, stopping, or materially changing an automation
- Adding or removing contacts from a consequential automation
- Bulk contact, list, tag, field, or segment changes
- Resubscribing contacts
- Deleting or merging records
- Changing lifecycle or plan tags at scale
- Creating or changing deals that trigger downstream automations
- Using paid or licensed third-party data

Draft creation alone does not grant permission to send, schedule, activate, or publish.

## Account scope and allowlists

Phase C must use explicit allowlists rather than unrestricted account discovery.

Initial allowlist categories:

- Nested Objects contact lists
- Nested Objects lifecycle and intent tags
- Nested Objects attribution and profile fields
- Nested Objects campaigns and automations
- ActiveCampaign ecommerce and recurring-payment mirrors used only as downstream evidence

Initial denylist categories:

- Legacy non-Nested Objects lists, tags, campaigns, automations, custom fields, and custom objects
- Generic demonstration assets without a verified Nested Objects owner or purpose
- Records whose business ownership is unclear

Allowlist membership should be based on stable IDs and documented purpose, not names alone. Names may change.

## Phase C integration

Phase C should add an ActiveCampaign sensor adapter that:

1. Reads only approved Nested Objects resources.
2. Normalizes campaign, automation, contact-engagement, segment, and delivery data.
3. Writes provenance-rich `business_metrics_daily` records.
4. Produces `intelligence_signals` for material performance changes, lifecycle routing failures, authority conflicts, stale automations, and data-quality gaps.
5. Creates recommendations and proposed actions rather than mutating ActiveCampaign directly.
6. Keeps existing reports for one parity cycle before retirement.

The first implementation should prioritize read-only reporting and lifecycle integrity. Mutation executors should be introduced later, one narrowly scoped action type at a time.

## Deployment decision

The agent runtime is expected to become a separate Vercel project when a real Phase C entry point exists. It should not be deployed merely to host placeholders.

No production ActiveCampaign mutation, deployment, or migration is authorized by this document.

## Reference

Official ActiveCampaign connector documentation:

https://help.activecampaign.com/hc/en-us/articles/25275642445724-Connect-ActiveCampaign-to-ChatGPT

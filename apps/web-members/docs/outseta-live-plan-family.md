# Outseta public plan-family configuration

The custom Nested Objects pricing page is code-allowlisted to the current public plans:

- Free
- Pro
- Elite
- Agency

Legacy Starter and Founders plans remain valid entitlement records for existing members, but they must not appear in public signup or self-service plan-change choices.

## Required Outseta configuration

1. Open **Billing → Plan Families**.
2. Create or confirm a plan family named **Nested Objects Live Plans**.
3. Include only Free, Pro, Elite, and Agency in that family.
4. Configure only the monthly and annual renewal rates currently offered for those plans.
5. Keep Starter and Founders in a separate **Nested Objects Legacy Plans** family.
6. Deactivate the legacy plan family after verifying that existing subscribers remain attached to their current plans.
7. Open **Auth → Embeds → Sign Up** and configure public signup to use **Nested Objects Live Plans**.
8. Open **Auth → Embeds → Profile** and configure the Change Plan view to use **Nested Objects Live Plans**.
9. Test both monthly and yearly choices with a nonproduction account. The yearly option must contain annual rates for live plans only.

Do not delete legacy plans or move existing subscribers automatically. Deactivating a legacy plan family removes it from new-customer and plan-change selection while preserving existing subscriptions.

## Code boundary

`publicMembershipPlans` is the application allowlist for public pricing cards and structured data. Outseta remains responsible for the options shown inside its hosted signup and profile embeds, so both layers must stay aligned.

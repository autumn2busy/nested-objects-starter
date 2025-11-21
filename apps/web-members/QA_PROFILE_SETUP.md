# Pro Plan Test Profile (Stripe test mode)

Use these steps to create a Pro subscription profile safely in test mode. This walkthrough mirrors the QA panel now shown on the Membership page and uses Stripe's test card numbers so no real charges occur.

## Steps
1. On `/membership`, click **Start Pro Checkout** (green button) to launch Stripe Checkout in test mode.
1. Open the Pro checkout link: https://nested-objects.outseta.com/auth?widgetMode=register&planUid=rQVqlLm6&planPaymentTerm=month&skipPlanOptions=true.
2. Register with any test name and email (they do not need to be real inboxes).
3. When prompted for payment, use the Stripe test Visa number `4242 4242 4242 4242` with any future expiration, any CVC, and any ZIP/postal code.
4. Complete the flow; you will land in the app with Pro entitlements enabled. You can repeat these steps as often as needed during QA without billing a real card.

> Ensure the following env vars are set for test checkout: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, and `NEXT_PUBLIC_SITE_URL`.

If you need to validate other card brands (e.g., declines or fraud checks), reference Stripe's full test card list in their docs.

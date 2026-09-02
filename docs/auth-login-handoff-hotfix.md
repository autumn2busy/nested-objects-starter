# Hosted Outseta login handoff hotfix

Date: 2026-09-02. Branch: `codex/fix-outseta-login-handoff`, based on merged main `3183b4d`. This branch excludes PR #334 staging activation/configuration.

## Incident and cause

The portal-protection changes in PR #327 (`900d371`, `c6703e3`) require a verified session before rendering the dashboard. Hosted Outseta login returns to `/inspector-dashboard?access_token=...` before the session cookie exists. Both the early middleware redirect and protected server layout run before the previous client-side token exchange can execute. Successful provider authentication therefore returns to login in a loop.

A read-only Production check reproduced a 307 back to hosted login with both no token and a deliberately invalid synthetic token. `/auth/callback` remained reachable. No real token was used in diagnostics.

## Correction

- GET login returns to protected portal paths or `/auth/callback` are internally routed to `/api/auth/complete` before the cookie-presence guard.
- The token is forwarded in a request-only header, not the rewrite URL. Incoming header values are overwritten; malformed, duplicate, non-JWT-shaped and oversized query values fail closed.
- The completion handler reuses the existing Outseta JWKS signature, issuer and expiry verification. It additionally requires a stable subject, then sets the existing HttpOnly/Secure/SameSite=Lax session cookie and returns a 303 to a clean same-origin application destination.
- No portal guard is removed or bypassed. A token's presence is not authorization. The server layout still independently verifies the cookie before rendering private content.
- Invalid returns go to a clean public callback error page, without setting a new session. Callback URLs, API/auth destinations, external origins and unsafe return targets cannot be used as post-login redirects.
- Handoffs return `Cache-Control: private, no-store, max-age=0` and `Referrer-Policy: no-referrer`. The client callback no longer logs URL/token-bearing data. The provider's original token-bearing return URL still exists; do not share screenshots, browser history or access logs containing it.

## Verification

- Nine regression tests pass. They load the actual middleware, completion handler, auth verifier and protected layout, use locally generated RSA keys with real JOSE verification, and cover successful cookie creation/guard passage, expired/wrong-issuer/wrong-signature/missing-subject tokens, malformed/duplicate/oversized input, header injection, redirect safety and callback log hygiene. The JWKS key source is test-local; no live member credentials are used.
- `audit:member-surfaces`, TypeScript and targeted lint pass.
- The real Next.js development-server runtime suite passes: signed-out portal denial, callback interception, invalid-token 303, no cookie creation, no token in response headers, cache/referrer policy, and existing locked-tool/API boundaries.
- Browser inspection confirms the invalid-session page renders the error and a Return to home link, with no framework error overlay. The first cold compile hit sandbox-blocked Google Fonts and used a fallback; no Next.js Production build was run.
- Tests are added to the existing member-surface CI workflow.

## Release boundary

Local verification is not Production recovery. Publishing a branch creates an automatic Vercel Preview; merge and Production rollout remain approval-gated. No database, Outseta configuration, passwords, entitlements, environment variables or Production deployment were changed for this fix.

After an approved rollout, the owner should perform one fresh hosted login (not reuse an exposed token), confirm the clean dashboard URL and authenticated session, then confirm a signed-out browser still cannot render the dashboard. Do not merge PR #334 as part of this hotfix.

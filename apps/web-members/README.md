# Auth implementation complete

## Playwright E2E auth test

The Playwright auth spec lives in `apps/web-members/tests/e2e/auth.spec.ts` and expects the
following environment variables:

- `E2E_LOGIN_URL` (required): Full login URL (for example, your Outseta login widget URL).
- `E2E_AUTH_EMAIL` (required): Login email.
- `E2E_AUTH_PASSWORD` (required): Login password.
- `E2E_BASE_URL` (optional): Base URL for the app after login (defaults to `http://localhost:3000`).
- `E2E_POST_LOGIN_PATH` (optional): Path that should load after login (defaults to `/`).

Keep secrets like `E2E_AUTH_PASSWORD` in environment variables (e.g., `.env.local` or CI secrets).

## Geocoding firm addresses

Run the geocoding helper to backfill latitude/longitude for firms with verified addresses:

```bash
npm run geocode:firms
```

The script uses the Supabase service role key to read and update `public.firms`, and will look for `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (in this folder or the repo root) before falling back to the current shell environment. Requests are rate-limited and cached per-address to avoid hammering the geocoder; firms without usable addresses are reported and skipped.

## Importing coordinates from a spreadsheet

Use the coordinate import helper to apply latitude/longitude values from a CSV export (matching on `id` when present and inserting new records when `id` is missing):

```bash
node ./scripts/import-firm-coordinates.js "/path/to/Sheet 1-firms_rows182_geocodio_5e3a33fa50f1b68f5bf5d74b96b86252200f26fd.csv"
```

The script expects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to be available (loaded from `.env.local`, `.env`, or the shell) and will skip rows without coordinates. Rows that include coordinates but no `id` will be inserted as new firms.

# Auth implementation complete

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

## Playwright E2E tests

The Playwright auth test uses the following environment variables:

- `E2E_BASE_URL` (defaults to `http://localhost:3000`)
- `E2E_USER_EMAIL`
- `E2E_USER_PASSWORD`

When credentials are not provided, the login form test is skipped.

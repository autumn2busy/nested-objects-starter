# Auth implementation complete

## Geocoding firm addresses

Run the geocoding helper to backfill latitude/longitude for firms with verified addresses:

```bash
npm run geocode:firms
```

The script uses the Supabase service role key to read and update `public.firms`, and will look for `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (in this folder or the repo root) before falling back to the current shell environment. Requests are rate-limited and cached per-address to avoid hammering the geocoder; firms without usable addresses are reported and skipped.

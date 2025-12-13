# Auth implementation complete

## Geocoding firm addresses

Use `node scripts/geocode-firms.mjs` to backfill latitude/longitude values for firms that have an address but no coordinates. The script:

- Pulls every row from `public.firms` including address and coordinate fields.
- Calls the Nominatim geocoder (OpenStreetMap) with a one-second delay between requests.
- Upserts the resulting coordinates back into the same `public.firms` rows.

### Prerequisites

Set the following environment variables before running the script:

- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`): your Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: service role key for write access to `public.firms`.
- Optional: `GEOCODER_USER_AGENT` to override the default HTTP user agent used for Nominatim requests.

### Running the script

```bash
cd apps/web-members
node scripts/geocode-firms.mjs
```

The script prints each address it geocodes, notes skipped rows without addresses, and reports how many firms were updated.

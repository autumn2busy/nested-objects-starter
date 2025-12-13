import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const USER_AGENT =
  process.env.GEOCODER_USER_AGENT || 'nested-objects-geocode-script/1.0 (support@nestedobjects.com)'

function buildAddress(row) {
  if (row.address) return row.address

  const parts = [row.address_line1, row.address_street, row.address_city, row.address_state, row.address_postal_code]
    .filter(Boolean)
    .map((part) => String(part).trim())
    .filter(Boolean)

  return parts.length ? parts.join(', ') : null
}

async function geocodeAddress(address) {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1',
  })

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      'User-Agent': USER_AGENT,
    },
  })

  if (!res.ok) {
    throw new Error(`Geocoder returned ${res.status} ${res.statusText}`)
  }

  const data = await res.json()

  if (!Array.isArray(data) || data.length === 0) return null

  const match = data[0]

  const latitude = Number(match.lat)
  const longitude = Number(match.lon)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  return { latitude, longitude }
}

async function fetchFirms() {
  const { data, error } = await supabase
    .from('firms')
    .select(
      [
        'id',
        'name',
        'address',
        'address_line1',
        'address_street',
        'address_city',
        'address_state',
        'address_postal_code',
        'latitude',
        'longitude',
      ].join(',')
    )

  if (error) {
    throw error
  }

  return data || []
}

async function updateCoordinates(rows) {
  if (rows.length === 0) return

  const { error } = await supabase.from('firms').upsert(rows, { onConflict: 'id' })

  if (error) {
    throw error
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  console.log('Fetching firms…')
  const firms = await fetchFirms()

  const toUpdate = []

  for (const firm of firms) {
    if (firm.latitude != null && firm.longitude != null) continue

    const address = buildAddress(firm)

    if (!address) {
      console.warn(`Skipping ${firm.name}: no address available`)
      continue
    }

    console.log(`Geocoding ${firm.name}: ${address}`)
    try {
      const coords = await geocodeAddress(address)
      if (!coords) {
        console.warn(`No geocode match for ${firm.name}`)
      } else {
        toUpdate.push({ id: firm.id, latitude: coords.latitude, longitude: coords.longitude })
        console.log(`→ ${coords.latitude}, ${coords.longitude}`)
      }
    } catch (error) {
      console.error(`Error geocoding ${firm.name}`, error)
    }

    // Respect Nominatim guidance of 1 request per second
    await sleep(1000)
  }

  if (toUpdate.length === 0) {
    console.log('No firms needed coordinate updates.')
    return
  }

  console.log(`Updating ${toUpdate.length} firms with coordinates…`)
  await updateCoordinates(toUpdate)
  console.log('Coordinate update complete!')
}

main().catch((error) => {
  console.error('Unexpected error during geocode run', error)
  process.exit(1)
})

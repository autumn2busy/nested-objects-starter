const fs = require('fs')
const path = require('path')

const { createClient } = require('@supabase/supabase-js')

/**
 * Minimal .env loader so we avoid pulling extra dependencies during ops scripts.
 * Later files in the array win, but existing process.env values are preserved.
 * @param {string} filePath
 */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split(/\r?\n/)

  for (const line of lines) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue
    const [rawKey, ...rest] = line.split('=')
    const key = rawKey.trim()
    const value = rest.join('=').trim().replace(/^['"]|['"]$/g, '')

    if (key && !(key in process.env)) {
      process.env[key] = value
    }
  }
}

const envCandidates = [
  path.resolve(__dirname, '../.env.local'),
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(process.cwd(), '.env'),
]

envCandidates.forEach(loadEnvFile)

/**
 * @typedef {Object} FirmRecord
 * @property {string} id
 * @property {string} name
 * @property {string|null} address
 * @property {string|null} address_line1
 * @property {string|null} address_street
 * @property {string|null} address_city
 * @property {string|null} address_state
 * @property {string|null} address_postal_code
 * @property {number|null} latitude
 * @property {number|null} longitude
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Build a human-friendly address using structured fields when available.
 * @param {FirmRecord} firm
 * @returns {string|null}
 */
function buildAddress(firm) {
  if (firm.address && firm.address.trim()) return firm.address.trim()

  const parts = [
    firm.address_line1 || firm.address_street,
    firm.address_city,
    firm.address_state,
    firm.address_postal_code,
  ]
    .filter((part) => Boolean(part && part.toString().trim()))
    .map((part) => part.toString().trim())

  if (!parts.length) return null

  return parts.join(', ')
}

/**
 * @param {string} address
 * @returns {Promise<{ latitude: number; longitude: number; displayName: string } | null>}
 */
async function geocodeAddress(address) {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    addressdetails: '1',
    limit: '1',
  })

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      'User-Agent': 'nested-objects-firm-geocoder/1.0 (support@nestedobjects.com)',
    },
  })

  if (!response.ok) {
    throw new Error(`Geocoding request failed (${response.status} ${response.statusText}) for: ${address}`)
  }

  const payload = await response.json()

  if (!Array.isArray(payload) || payload.length === 0) return null

  const [first] = payload
  const latitude = Number.parseFloat(first.lat)
  const longitude = Number.parseFloat(first.lon)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  return {
    latitude,
    longitude,
    displayName: first.display_name,
  }
}

/**
 * @param {FirmRecord} firm
 * @param {{ latitude: number; longitude: number; displayName: string }} coords
 */
async function updateCoordinates(firm, coords) {
  const { error } = await supabase
    .from('firms')
    .update({ latitude: coords.latitude, longitude: coords.longitude })
    .eq('id', firm.id)

  if (error) {
    throw new Error(`Failed to update ${firm.name}: ${error.message}`)
  }
}

async function main() {
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
      ].join(', ')
    )
    .order('name')

  if (error || !data) {
    throw new Error(`Unable to load firms: ${error?.message ?? 'Unknown error'}`)
  }

  const missingAddress = []
  const firmsNeedingCoords = data.filter((firm) => {
    const address = buildAddress(firm)
    if (!address) {
      missingAddress.push(firm)
      return false
    }

    return firm.latitude == null || firm.longitude == null
  })

  console.log(`Total firms: ${data.length}`)
  console.log(`Firms missing coordinates: ${firmsNeedingCoords.length}`)
  if (missingAddress.length) {
    console.log(`Firms missing address data: ${missingAddress.length}`)
  }

  const cache = new Map()
  const successes = []
  const failures = []

  for (const firm of firmsNeedingCoords) {
    const address = buildAddress(firm)

    if (!address) {
      failures.push({ id: firm.id, name: firm.name, address: 'N/A', reason: 'No address available' })
      continue
    }

    let geocoded = cache.get(address)
    let lookedUp = false

    if (geocoded === undefined) {
      lookedUp = true
      geocoded = await geocodeAddress(address)
      cache.set(address, geocoded)
    }

    if (!geocoded) {
      failures.push({ id: firm.id, name: firm.name, address, reason: 'No geocode match found' })
      continue
    }

    try {
      await updateCoordinates(firm, geocoded)
      successes.push({ id: firm.id, name: firm.name, address })
      console.log(`Updated ${firm.name} -> (${geocoded.latitude}, ${geocoded.longitude})`)
    } catch (updateError) {
      failures.push({
        id: firm.id,
        name: firm.name,
        address,
        reason: updateError instanceof Error ? updateError.message : 'Unknown update error',
      })
    }

    if (lookedUp) {
      await delay(1100)
    }
  }

  console.log('\nGeocoding complete:')
  console.log(`  Successful updates: ${successes.length}`)
  console.log(`  Failed updates: ${failures.length}`)

  if (missingAddress.length) {
    console.log('\nSkipped (missing address):')
    missingAddress.forEach((firm) => console.log(`- ${firm.name}`))
  }

  if (failures.length) {
    console.log('\nFailures:')
    failures.forEach((failure) =>
      console.log(`- ${failure.name} (${failure.address}): ${failure.reason}`)
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

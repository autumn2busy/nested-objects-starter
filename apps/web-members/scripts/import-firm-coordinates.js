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

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function normalizeHeader(header) {
  return header.trim().toLowerCase().replace(/\s+/g, '_')
}

/**
 * Basic CSV parser that supports quoted values and embedded commas/newlines.
 * @param {string} content
 * @returns {string[][]}
 */
function parseCsv(content) {
  const rows = []
  let row = []
  let value = ''
  let inQuotes = false
  const input = content.replace(/^\uFEFF/, '')

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]

    if (char === '"') {
      const next = input[i + 1]
      if (inQuotes && next === '"') {
        value += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && input[i + 1] === '\n') {
        i += 1
      }
      row.push(value)
      rows.push(row)
      row = []
      value = ''
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(value)
      value = ''
      continue
    }

    value += char
  }

  if (value.length > 0 || row.length) {
    row.push(value)
    rows.push(row)
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim().length > 0))
}

/**
 * Convert CSV text into array of normalized objects.
 * @param {string} filePath
 */
function loadCsvRecords(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const [headerRow, ...dataRows] = parseCsv(content)

  if (!headerRow) {
    throw new Error('CSV file is missing a header row.')
  }

  const headers = headerRow.map(normalizeHeader)

  return dataRows.map((row) => {
    const record = {}
    headers.forEach((header, index) => {
      record[header] = row[index] ?? ''
    })
    return record
  })
}

function toNullableString(value) {
  if (value === null || value === undefined) return null
  const stringValue = String(value).trim()
  return stringValue.length ? stringValue : null
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function toNullableBoolean(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'boolean') return value
  const normalized = String(value).trim().toLowerCase()
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true
  if (['false', '0', 'no', 'n'].includes(normalized)) return false
  return null
}

const OPTIONAL_STRING_FIELDS = [
  'slug',
  'url',
  'vendor_page_url',
  'geographic_coverage',
  'company_size',
  'industry_focus',
  'description',
  'phone',
  'email',
  'address',
  'address_line1',
  'address_street',
  'address_city',
  'address_state',
  'address_postal_code',
]

const OPTIONAL_BOOLEAN_FIELDS = ['is_published']

function normalizeRow(rawRow) {
  const latitude =
    toNullableNumber(rawRow.latitude) ??
    toNullableNumber(rawRow.lat) ??
    toNullableNumber(rawRow.geo_lat) ??
    toNullableNumber(rawRow.latitude_decimal) ??
    null

  const longitude =
    toNullableNumber(rawRow.longitude) ??
    toNullableNumber(rawRow.long) ??
    toNullableNumber(rawRow.lng) ??
    toNullableNumber(rawRow.lon) ??
    toNullableNumber(rawRow.geo_long) ??
    toNullableNumber(rawRow.longitude_decimal) ??
    null

  const normalized = {
    id: toNullableString(rawRow.id),
    name: toNullableString(rawRow.name),
    latitude,
    longitude,
  }

  OPTIONAL_STRING_FIELDS.forEach((field) => {
    const value = toNullableString(rawRow[field])
    if (value !== null) {
      normalized[field] = value
    }
  })

  OPTIONAL_BOOLEAN_FIELDS.forEach((field) => {
    const value = toNullableBoolean(rawRow[field])
    if (value !== null) {
      normalized[field] = value
    }
  })

  return normalized
}

async function upsertCoordinates(rows) {
  const chunkSize = 100
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase.from('firms').upsert(chunk, { onConflict: 'id' })
    if (error) {
      throw new Error(`Failed to upsert coordinates: ${error.message}`)
    }
  }
}

async function insertNewFirms(rows) {
  const chunkSize = 100
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase.from('firms').insert(chunk)
    if (error) {
      throw new Error(`Failed to insert new firms: ${error.message}`)
    }
  }
}

async function main() {
  const csvArg = process.argv.slice(2).join(' ')

  if (!csvArg) {
    throw new Error('Usage: node scripts/import-firm-coordinates.js <path-to-csv>')
  }

  const csvPath = path.resolve(process.cwd(), csvArg)

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found at ${csvPath}`)
  }

  const rawRecords = loadCsvRecords(csvPath)
  const normalized = rawRecords.map(normalizeRow)

  const withCoordinates = normalized.filter(
    (row) => Number.isFinite(row.latitude) && Number.isFinite(row.longitude)
  )

  if (!withCoordinates.length) {
    console.log('No rows with latitude/longitude values found in the CSV.')
    return
  }

  const { data: existing, error: existingError } = await supabase
    .from('firms')
    .select('id')

  if (existingError) {
    throw new Error(`Unable to load existing firms: ${existingError.message}`)
  }

  const existingIds = new Set((existing ?? []).map((firm) => firm.id))

  const updatePayload = []
  const insertPayload = []
  const skippedMissingName = []

  for (const row of withCoordinates) {
    const { id, name, latitude, longitude, ...rest } = row

    if (id && existingIds.has(id)) {
      updatePayload.push({ id, latitude, longitude })
      continue
    }

    if (!name) {
      skippedMissingName.push(row)
      continue
    }

    insertPayload.push({ name, latitude, longitude, ...rest })
  }

  if (updatePayload.length) {
    console.log(`Updating coordinates for ${updatePayload.length} existing firm(s)...`)
    await upsertCoordinates(updatePayload)
  }

  if (insertPayload.length) {
    console.log(`Inserting ${insertPayload.length} new firm(s)...`)
    await insertNewFirms(insertPayload)
  }

  if (skippedMissingName.length) {
    console.log(`Skipped ${skippedMissingName.length} row(s) missing a firm name.`)
  }

  console.log('Coordinate import complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

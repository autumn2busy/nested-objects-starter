import { NextResponse } from 'next/server'

import { createServiceRoleClient } from '@/lib/supabase-server'

type SpreadsheetFirmRow = Record<string, any>

type NormalizedFirmRow = {
  name: string
  slug?: string | null
  url?: string | null
  vendor_page_url?: string | null
  geographic_coverage?: string | null
  company_size?: string | null
  industry_focus?: string | null
  description?: string | null
  phone?: string | null
  email?: string | null
  address_line1?: string | null
  address_street?: string | null
  address_city?: string | null
  address_state?: string | null
  address_postal_code?: string | null
  latitude?: number | null
  longitude?: number | null
  is_published?: boolean | null
}

const IMPORT_SECRET = process.env.FIRM_IMPORT_SECRET

function toNullableString(value: any) {
  if (value === null || value === undefined) return null
  const stringValue = String(value).trim()
  return stringValue.length ? stringValue : null
}

function toNullableNumber(value: any) {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function toNullableBoolean(value: any) {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value
  const stringValue = String(value).trim().toLowerCase()
  if (['true', '1', 'yes', 'y'].includes(stringValue)) return true
  if (['false', '0', 'no', 'n'].includes(stringValue)) return false
  return null
}

function normalizeSpreadsheetRow(row: SpreadsheetFirmRow): NormalizedFirmRow | null {
  const name = toNullableString(row.name)

  if (!name) return null

  const latitude = toNullableNumber(row.latitude ?? row.lat)
  const longitude = toNullableNumber(row.longitude ?? row.lng)

  return {
    name,
    slug: toNullableString(row.slug),
    url: toNullableString(row.url),
    vendor_page_url: toNullableString(row.vendor_page_url),
    geographic_coverage: toNullableString(row.geographic_coverage),
    company_size: toNullableString(row.company_size),
    industry_focus: toNullableString(row.industry_focus),
    description: toNullableString(row.description),
    phone: toNullableString(row.phone),
    email: toNullableString(row.email),
    address_line1: toNullableString(row.address_line1),
    address_street: toNullableString(row.address_street),
    address_city: toNullableString(row.address_city),
    address_state: toNullableString(row.address_state),
    address_postal_code: toNullableString(row.address_postal_code),
    latitude,
    longitude,
    is_published: toNullableBoolean(row.is_published),
  }
}

export async function POST(request: Request) {
  try {
    if (IMPORT_SECRET) {
      const providedSecret = request.headers.get('x-import-secret')

      if (providedSecret !== IMPORT_SECRET) {
        return NextResponse.json({ error: 'Unauthorized import request.' }, { status: 403 })
      }
    }

    const body = await request.json().catch(() => null)

    const rows = Array.isArray(body?.rows) ? body.rows : Array.isArray(body) ? body : null

    if (!rows) {
      return NextResponse.json({ error: 'Expected an array of spreadsheet rows.' }, { status: 400 })
    }

    const normalized = rows
      .map(normalizeSpreadsheetRow)
      .filter((row): row is NormalizedFirmRow => Boolean(row))

    if (!normalized.length) {
      return NextResponse.json({ error: 'No valid firm rows to import.' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const { error } = await supabase
      .from('firms')
      .upsert(normalized, { onConflict: 'slug' })

    if (error) {
      console.error('[FIRM_IMPORT_ERROR]', error)
      return NextResponse.json({ error: 'Unable to import firms.' }, { status: 500 })
    }

    return NextResponse.json({ imported: normalized.length })
  } catch (error) {
    console.error('[FIRM_IMPORT_UNEXPECTED]', error)
    return NextResponse.json({ error: 'Unexpected error during import.' }, { status: 500 })
  }
}

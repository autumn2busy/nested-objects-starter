#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(appRoot, '..', '..')

dotenv.config({ path: path.join(repoRoot, '.env.local') })
dotenv.config({ path: path.join(appRoot, '.env.local') })

const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith('--'))
    .map((arg) => {
      const [key, ...rest] = arg.slice(2).split('=')
      return [key, rest.join('=') || 'true']
    }),
)

const localJsonPath = args.get('local-json')
const limit = Number.parseInt(args.get('limit') || '0', 10)
const reportsDir = path.join(appRoot, 'reports')
const runDate = new Date().toISOString().slice(0, 10)

const REQUIRED_VALUE_FIELDS = [
  'slug',
  'name',
  'description',
  'industry_focus',
  'geographic_coverage',
  'services',
  'pay_min',
  'pay_max',
  'pay_type',
  'url',
  'vendor_page_url',
  'phone',
  'email',
  'address',
  'latitude',
  'longitude',
  'contractor_rating',
  'verified_at',
  'vendor_verified',
]

const FIELD_WEIGHTS = {
  slug: 8,
  name: 10,
  description: 8,
  industry_focus: 8,
  geographic_coverage: 9,
  services: 8,
  pay_min: 8,
  pay_max: 8,
  pay_type: 5,
  url: 8,
  vendor_page_url: 10,
  phone: 5,
  email: 5,
  address: 4,
  latitude: 3,
  longitude: 3,
  contractor_rating: 6,
  verified_at: 8,
  vendor_verified: 8,
}

const OPTIONAL_TRACKING_FIELDS = [
  'rating_count',
  'source',
  'address_source',
  'bbb_status',
  'social_links',
  'logo_url',
  'recruiter_contact',
  'payment_frequency',
  'job_volume',
]

const HIGH_VALUE_FIELDS = [
  'vendor_page_url',
  'email',
  'phone',
  'pay_min',
  'pay_max',
  'pay_type',
  'geographic_coverage',
  'industry_focus',
  'services',
  'verified_at',
  'vendor_verified',
]

function isBlank(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '' || normalized === 'n/a' || normalized === 'na' || normalized === 'none' || normalized === 'null' || normalized === '-'
  }
  if (Array.isArray(value)) return value.length === 0
  return false
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\b(incorporated|inc|llc|ltd|corp|corporation|company|co)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeUrl(value) {
  if (isBlank(value)) return ''
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
    const parsed = new URL(withProtocol)
    return parsed.hostname.replace(/^www\./, '').toLowerCase() + parsed.pathname.replace(/\/$/, '')
  } catch {
    return String(value).toLowerCase().trim()
  }
}

function getMissingFields(firm) {
  return REQUIRED_VALUE_FIELDS.filter((field) => isBlank(firm[field]))
}

function scoreFirm(firm) {
  const total = Object.values(FIELD_WEIGHTS).reduce((sum, value) => sum + value, 0)
  const earned = Object.entries(FIELD_WEIGHTS).reduce((sum, [field, weight]) => {
    return isBlank(firm[field]) ? sum : sum + weight
  }, 0)
  return Math.round((earned / total) * 100)
}

function getPriority(firm, missingFields, duplicateFlags) {
  const missingHighValue = missingFields.filter((field) => HIGH_VALUE_FIELDS.includes(field))
  if (duplicateFlags.length > 0) return 'P0_DUPLICATE_REVIEW'
  if (isBlank(firm.slug) || isBlank(firm.name)) return 'P0_DIRECTORY_INTEGRITY'
  if (missingHighValue.includes('vendor_page_url') && missingHighValue.includes('email') && missingHighValue.includes('phone')) {
    return 'P1_CONTACT_GAP'
  }
  if (missingHighValue.includes('pay_min') || missingHighValue.includes('pay_max') || missingHighValue.includes('pay_type')) {
    return 'P1_PAY_GAP'
  }
  if (missingHighValue.includes('geographic_coverage') || missingHighValue.includes('industry_focus') || missingHighValue.includes('services')) {
    return 'P2_CLASSIFICATION_GAP'
  }
  if (missingHighValue.includes('verified_at') || missingHighValue.includes('vendor_verified')) {
    return 'P2_VERIFICATION_GAP'
  }
  return 'P3_POLISH'
}

function summarizeBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || 'Unknown'
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}

async function loadFromSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL plus SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })

  const rows = []
  const pageSize = 1000

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from('firms')
      .select('*')
      .range(from, to)

    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
    if (limit > 0 && rows.length >= limit) break
  }

  return limit > 0 ? rows.slice(0, limit) : rows
}

function loadFromLocalJson(filePath) {
  const resolved = path.resolve(process.cwd(), filePath)
  return JSON.parse(fs.readFileSync(resolved, 'utf8'))
}

function buildReport(firms) {
  const publishedFirms = firms.filter((firm) => firm.is_published !== false)
  const nameBuckets = new Map()
  const urlBuckets = new Map()

  for (const firm of publishedFirms) {
    const normalizedName = normalizeText(firm.name)
    if (normalizedName) {
      if (!nameBuckets.has(normalizedName)) nameBuckets.set(normalizedName, [])
      nameBuckets.get(normalizedName).push(firm)
    }

    const normalizedUrl = normalizeUrl(firm.url || firm.website || firm.vendor_page_url)
    if (normalizedUrl) {
      if (!urlBuckets.has(normalizedUrl)) urlBuckets.set(normalizedUrl, [])
      urlBuckets.get(normalizedUrl).push(firm)
    }
  }

  const duplicateNames = new Set(
    [...nameBuckets.values()]
      .filter((bucket) => bucket.length > 1)
      .flat()
      .map((firm) => firm.id),
  )
  const duplicateUrls = new Set(
    [...urlBuckets.values()]
      .filter((bucket) => bucket.length > 1)
      .flat()
      .map((firm) => firm.id),
  )

  const audited = publishedFirms.map((firm) => {
    const missingFields = getMissingFields(firm)
    const duplicateFlags = []
    if (duplicateNames.has(firm.id)) duplicateFlags.push('duplicate_name')
    if (duplicateUrls.has(firm.id)) duplicateFlags.push('duplicate_url')

    const score = scoreFirm(firm)
    const priority = getPriority(firm, missingFields, duplicateFlags)

    return {
      id: firm.id,
      slug: firm.slug || null,
      name: firm.name || null,
      is_published: firm.is_published ?? null,
      score,
      priority,
      missing_fields: missingFields,
      duplicate_flags: duplicateFlags,
      industry_focus: firm.industry_focus || null,
      geographic_coverage: firm.geographic_coverage || null,
      url: firm.url || firm.website || null,
      vendor_page_url: firm.vendor_page_url || null,
      email: firm.email || null,
      phone: firm.phone || null,
      verified_at: firm.verified_at || null,
      vendor_verified: firm.vendor_verified ?? null,
      pay_min: firm.pay_min ?? null,
      pay_max: firm.pay_max ?? null,
      pay_type: firm.pay_type || null,
    }
  })

  const fieldMissingCounts = REQUIRED_VALUE_FIELDS.reduce((acc, field) => {
    acc[field] = audited.filter((firm) => firm.missing_fields.includes(field)).length
    return acc
  }, {})

  const optionalMissingCounts = OPTIONAL_TRACKING_FIELDS.reduce((acc, field) => {
    acc[field] = publishedFirms.filter((firm) => isBlank(firm[field])).length
    return acc
  }, {})

  const sortedQueue = [...audited].sort((a, b) => {
    const priorityOrder = {
      P0_DUPLICATE_REVIEW: 0,
      P0_DIRECTORY_INTEGRITY: 1,
      P1_CONTACT_GAP: 2,
      P1_PAY_GAP: 3,
      P2_CLASSIFICATION_GAP: 4,
      P2_VERIFICATION_GAP: 5,
      P3_POLISH: 6,
    }
    return (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99) || a.score - b.score
  })

  return {
    generated_at: new Date().toISOString(),
    total_firms: firms.length,
    published_firms: publishedFirms.length,
    unpublished_firms: firms.length - publishedFirms.length,
    average_score: Math.round(audited.reduce((sum, firm) => sum + firm.score, 0) / Math.max(audited.length, 1)),
    field_missing_counts: fieldMissingCounts,
    optional_missing_counts: optionalMissingCounts,
    priority_counts: summarizeBy(audited, 'priority'),
    duplicate_name_groups: [...nameBuckets.entries()]
      .filter(([, bucket]) => bucket.length > 1)
      .map(([normalized, bucket]) => ({
        normalized,
        firms: bucket.map((firm) => ({ id: firm.id, name: firm.name, slug: firm.slug })),
      })),
    duplicate_url_groups: [...urlBuckets.entries()]
      .filter(([, bucket]) => bucket.length > 1)
      .map(([normalized, bucket]) => ({
        normalized,
        firms: bucket.map((firm) => ({ id: firm.id, name: firm.name, slug: firm.slug })),
      })),
    enrichment_queue: sortedQueue.slice(0, 100),
    all_firms: audited,
  }
}

function formatPercent(count, total) {
  return `${count} (${Math.round((count / Math.max(total, 1)) * 100)}%)`
}

function toMarkdown(report) {
  const topMissing = Object.entries(report.field_missing_counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
  const optionalMissing = Object.entries(report.optional_missing_counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const queueRows = report.enrichment_queue.slice(0, 25).map((firm) => {
    const missing = firm.missing_fields.slice(0, 8).join(', ')
    return `| ${firm.priority} | ${firm.score} | ${firm.name || ''} | ${firm.slug || ''} | ${missing} |`
  })

  return `# Directory Data Quality Report

Generated: ${report.generated_at}

## Summary

- Total firms: ${report.total_firms}
- Published firms: ${report.published_firms}
- Unpublished firms: ${report.unpublished_firms}
- Average quality score: ${report.average_score}
- Duplicate name groups: ${report.duplicate_name_groups.length}
- Duplicate URL groups: ${report.duplicate_url_groups.length}

## Top Missing Fields

| Field | Missing |
| --- | ---: |
${topMissing.map(([field, count]) => `| ${field} | ${formatPercent(count, report.published_firms)} |`).join('\n')}

## Optional Tracking Gaps

| Field | Missing |
| --- | ---: |
${optionalMissing.map(([field, count]) => `| ${field} | ${formatPercent(count, report.published_firms)} |`).join('\n')}

## Priority Counts

| Priority | Count |
| --- | ---: |
${Object.entries(report.priority_counts).map(([priority, count]) => `| ${priority} | ${count} |`).join('\n')}

## Top Enrichment Queue

| Priority | Score | Firm | Slug | Missing Fields |
| --- | ---: | --- | --- | --- |
${queueRows.join('\n')}

## Next Actions

1. Resolve P0 duplicate and directory integrity rows before enriching new fields.
2. Fill P1 contact gaps with vendor page, email, or phone.
3. Fill P1 pay gaps from public vendor docs or member-submitted intel.
4. Fill P2 classification gaps for coverage, services, and industry focus.
5. Mark verified rows with \`verified_at\` and \`vendor_verified\` once reviewed.
`
}

async function main() {
  const firms = localJsonPath ? loadFromLocalJson(localJsonPath) : await loadFromSupabase()
  const report = buildReport(firms)

  fs.mkdirSync(reportsDir, { recursive: true })

  const jsonPath = path.join(reportsDir, `directory-data-quality-${runDate}.json`)
  const mdPath = path.join(reportsDir, `directory-data-quality-${runDate}.md`)

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2))
  fs.writeFileSync(mdPath, toMarkdown(report))

  console.log(`Directory data quality audit complete.`)
  console.log(`Firms: ${report.total_firms}`)
  console.log(`Average score: ${report.average_score}`)
  console.log(`Duplicate name groups: ${report.duplicate_name_groups.length}`)
  console.log(`Duplicate URL groups: ${report.duplicate_url_groups.length}`)
  console.log(`JSON: ${jsonPath}`)
  console.log(`Markdown: ${mdPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

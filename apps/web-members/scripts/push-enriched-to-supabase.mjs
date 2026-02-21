#!/usr/bin/env node

/**
 * push-enriched-to-supabase.mjs
 * 
 * Reads firms_ai_enriched.json (or firms_export_enriched.json) and upserts
 * all records to Supabase. Can do a dry-run sync check first.
 * 
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/push-enriched-to-supabase.mjs
 * 
 * Options:
 *   --check-only   Compare JSON vs DB and report drift without writing
 *   --source=FILE  Use a different JSON file (default: firms_ai_enriched.json)
 *   --batch=N      Upsert N records at a time (default: 25)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const CHECK_ONLY = process.argv.includes('--check-only')
const SOURCE_ARG = process.argv.find(a => a.startsWith('--source='))?.split('=')[1]
const BATCH_SIZE = parseInt(process.argv.find(a => a.startsWith('--batch='))?.split('=')[1] || '25')

const SOURCE_FILE = SOURCE_ARG
    ? path.resolve(SOURCE_ARG)
    : path.join(__dirname, '..', 'firms_ai_enriched.json')

const FALLBACK_FILE = path.join(__dirname, '..', 'firms_export_enriched.json')
const JSON_PATH = fs.existsSync(SOURCE_FILE) ? SOURCE_FILE : FALLBACK_FILE

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables')
    process.exit(1)
}

const PUSH_FIELDS = [
    'name', 'slug', 'url', 'vendor_page_url', 'description',
    'geographic_coverage', 'company_size', 'company_type', 'industry_focus',
    'assignment_process', 'specializations', 'services', 'categories',
    'pay_range', 'pay_min', 'pay_max', 'pay_type',
    'compensation_structure', 'payment_frequency', 'job_volume',
    'phone', 'email', 'address',
    'rating', 'contractor_rating',
    'logo_url', 'founded', 'social_links',
    'qualifications', 'required_technology', 'equipment_requirements',
    'equipment_provision', 'training_provided', 'onboarding_process',
    'bbb_status', 'industry_recognition', 'client_reviews',
    'latitude', 'longitude',
    'vendor_verified', 'is_published', 'source',
    'brand_primary', 'brand_secondary', 'recruiter_contact',
    'starter_featured', 'starter_rank',
    'address_confidence', 'address_source',
]

async function supaFetch(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1${endpoint}`
    const res = await fetch(url, {
        ...options,
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': options.prefer || 'return=minimal',
            ...options.headers,
        },
    })
    return res
}

async function fetchAllFromDb() {
    const res = await supaFetch('/firms?select=id,slug,description,pay_min,pay_max,compensation_structure,client_reviews,contractor_rating,services,updated_at&limit=1000')
    if (!res.ok) throw new Error(`Failed to fetch firms: ${res.status} ${await res.text()}`)
    return res.json()
}

async function checkSync(jsonFirms) {
    console.log('🔍 Running sync check...\n')
    const dbFirms = await fetchAllFromDb()

    const dbBySlug = Object.fromEntries(dbFirms.map(f => [f.slug, f]))
    let inJsonNotDb = 0
    let driftFields = 0
    const driftDetails = []

    const CHECK_FIELDS = ['description', 'pay_min', 'pay_max', 'compensation_structure', 'client_reviews', 'contractor_rating', 'services']

    for (const jf of jsonFirms) {
        const dbf = dbBySlug[jf.slug]
        if (!dbf) { inJsonNotDb++; continue }

        for (const field of CHECK_FIELDS) {
            const jVal = jf[field]
            const dVal = dbf[field]
            const jFilled = jVal !== null && jVal !== undefined && jVal !== '' && jVal !== 0
            const dEmpty = dVal === null || dVal === undefined || dVal === '' || dVal === 0
            if (jFilled && dEmpty) {
                driftFields++
                if (driftDetails.length < 20) {
                    driftDetails.push({ slug: jf.slug, field, json_value: typeof jVal === 'string' ? jVal.slice(0, 60) : jVal })
                }
            }
        }
    }

    const jsonSlugs = new Set(jsonFirms.map(f => f.slug))
    const inDbNotJson = dbFirms.filter(f => !jsonSlugs.has(f.slug)).length

    console.log(`DB firms: ${dbFirms.length}`)
    console.log(`JSON firms: ${jsonFirms.length}`)
    console.log(`In JSON but not DB: ${inJsonNotDb}`)
    console.log(`In DB but not JSON: ${inDbNotJson}`)
    console.log(`Fields filled in JSON but empty in DB: ${driftFields}`)

    if (driftDetails.length > 0) {
        console.log('\nSample drift (first 20):')
        driftDetails.forEach(d => console.log(`  ${d.slug} → ${d.field}: ${JSON.stringify(d.json_value)}`))
    }

    if (driftFields === 0 && inJsonNotDb === 0) {
        console.log('\n✅ DB is in sync with JSON — no push needed.')
    } else {
        console.log(`\n⚠ ${driftFields} field(s) need pushing. Run without --check-only to upsert.`)
    }

    return { driftFields, inJsonNotDb }
}

async function pushToSupabase(jsonFirms) {
    console.log(`\n📤 Pushing ${jsonFirms.length} firms to Supabase in batches of ${BATCH_SIZE}...\n`)
    let success = 0, errors = 0

    for (let i = 0; i < jsonFirms.length; i += BATCH_SIZE) {
        const batch = jsonFirms.slice(i, i + BATCH_SIZE)

        const records = batch.map(firm => {
            const rec = { id: firm.id }
            for (const field of PUSH_FIELDS) {
                if (firm[field] !== undefined) rec[field] = firm[field]
            }
            rec.updated_at = new Date().toISOString()
            return rec
        })

        const res = await supaFetch('/firms', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify(records),
        })

        if (res.ok) {
            success += batch.length
        } else {
            const errText = await res.text()
            console.error(`  ❌ Batch ${i}-${i + batch.length} failed: ${res.status} ${errText}`)
            errors += batch.length
        }

        const done = Math.min(i + BATCH_SIZE, jsonFirms.length)
        const pct = ((done / jsonFirms.length) * 100).toFixed(1)
        process.stdout.write(`  [${done}/${jsonFirms.length}] ${pct}%\r`)

        if (i + BATCH_SIZE < jsonFirms.length) await new Promise(r => setTimeout(r, 200))
    }

    console.log(`\n\n✅ Push complete: ${success} succeeded, ${errors} failed`)
}

async function main() {
    console.log(`Source: ${JSON_PATH}`)
    const jsonFirms = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'))
    console.log(`Loaded ${jsonFirms.length} firms\n`)

    if (CHECK_ONLY) {
        await checkSync(jsonFirms)
        return
    }

    const { driftFields, inJsonNotDb } = await checkSync(jsonFirms)
    if (driftFields === 0 && inJsonNotDb === 0) {
        console.log('Nothing to push. Exiting.')
        return
    }

    await pushToSupabase(jsonFirms)
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1) })

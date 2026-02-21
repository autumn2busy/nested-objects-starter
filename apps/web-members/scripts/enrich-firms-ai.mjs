#!/usr/bin/env node

/**
 * enrich-firms-ai.mjs
 * 
 * Reads firms_export_enriched.json, identifies gaps, calls Groq to generate
 * realistic estimates for: description, pay_min, pay_max, pay_type,
 * compensation_structure, contractor_rating, client_reviews, services.
 * 
 * All AI-generated values are tracked in a `_ai_enriched_fields` array
 * so they can be flagged in the UI and verified later.
 * 
 * Usage:
 *   GROQ_API_KEY=gsk_... node scripts/enrich-firms-ai.mjs
 *   
 * Options:
 *   --dry-run     Print what would be enriched without calling Groq
 *   --limit=N     Only process N firms (for testing)
 *   --skip=N      Skip first N firms (for resuming)
 *   --model=NAME  Override model (default: llama-3.3-70b-versatile)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIRMS_PATH = path.join(__dirname, '..', 'firms_export_enriched.json')
const OUTPUT_PATH = path.join(__dirname, '..', 'firms_ai_enriched.json')
const REPORT_PATH = path.join(__dirname, '..', 'enrichment_report.json')

const GROQ_API_KEY = process.env.GROQ_API_KEY
const DRY_RUN = process.argv.includes('--dry-run')
const LIMIT = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] || '0')
const SKIP = parseInt(process.argv.find(a => a.startsWith('--skip='))?.split('=')[1] || '0')
const MODEL = process.argv.find(a => a.startsWith('--model='))?.split('=')[1] || 'llama-3.3-70b-versatile'

if (!GROQ_API_KEY && !DRY_RUN) {
    console.error('ERROR: Set GROQ_API_KEY environment variable or use --dry-run')
    process.exit(1)
}

// ─── Field gap detection ────────────────────────────────────────

function getGaps(firm) {
    const gaps = []
    if (!firm.description || firm.description.trim() === '') gaps.push('description')
    if (!firm.pay_min && !firm.pay_max && !firm.pay_range) {
        gaps.push('pay_min', 'pay_max', 'pay_type')
    }
    if (!firm.compensation_structure || firm.compensation_structure.trim() === '') {
        gaps.push('compensation_structure')
    }
    if (!firm.contractor_rating || firm.contractor_rating === 0) {
        gaps.push('contractor_rating')
    }
    if (!firm.client_reviews || firm.client_reviews.trim() === '') {
        gaps.push('client_reviews')
    }
    if (!firm.services || firm.services.trim() === '') {
        gaps.push('services')
    }
    return gaps
}

// ─── Groq API call ──────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a field services industry data analyst. You generate realistic estimates for firm directory profiles based on available context about each company.

IMPORTANT RULES:
- Pay ranges should be realistic for the field services / inspection / property preservation industry
- Typical inspection pay: $25-75 per inspection depending on type
- Typical notary signing: $75-175 per signing
- Loss control: $35-100 per inspection
- Property preservation: $15-75 per work order
- Larger national firms tend to pay less per unit but have higher volume
- Smaller regional firms often pay more per unit but lower volume
- contractor_rating should be between 1.0 and 5.0 (most firms cluster 2.5-4.2)
- client_reviews should be a short realistic summary sentence
- compensation_structure should describe how the firm pays (per inspection, per hour, per project, etc.)
- services should list the main service offerings
- description should be 1-2 sentences about what the firm does

Return ONLY valid JSON with the requested fields. No markdown, no explanation, no backticks.`

async function enrichWithGroq(firm, gaps) {
    const context = {
        name: firm.name,
        industry_focus: firm.industry_focus || 'Unknown',
        company_type: firm.company_type || 'Unknown',
        company_size: firm.company_size || 'Unknown',
        geographic_coverage: firm.geographic_coverage || 'Unknown',
        categories: Array.isArray(firm.categories) ? firm.categories.join(', ') : (firm.categories || 'Unknown'),
        existing_services: firm.services || null,
        existing_specializations: firm.specializations || null,
        existing_description: firm.description || null,
        existing_pay_range: firm.pay_range || null,
        existing_pay_type: firm.pay_type || null,
    }

    const fieldsNeeded = {}
    if (gaps.includes('description')) fieldsNeeded.description = 'string: 1-2 sentence company description'
    if (gaps.includes('pay_min')) {
        fieldsNeeded.pay_min = 'number: low end of typical pay per unit in USD'
        fieldsNeeded.pay_max = 'number: high end of typical pay per unit in USD'
        fieldsNeeded.pay_type = 'string: per inspection, per signing, per hour, per work order, etc.'
    }
    if (gaps.includes('compensation_structure')) {
        fieldsNeeded.compensation_structure = 'string: how this firm typically compensates contractors (1099, per-unit, flat rate, etc.)'
    }
    if (gaps.includes('contractor_rating')) {
        fieldsNeeded.contractor_rating = 'number: estimated contractor satisfaction rating 1.0-5.0'
    }
    if (gaps.includes('client_reviews')) {
        fieldsNeeded.client_reviews = 'string: 1 sentence realistic review summary from contractors'
    }
    if (gaps.includes('services')) {
        fieldsNeeded.services = 'string: comma-separated list of main services offered'
    }

    const userPrompt = `Generate realistic field services industry estimates for this firm:

FIRM CONTEXT:
${JSON.stringify(context, null, 2)}

FIELDS NEEDED (return ONLY these as a JSON object):
${JSON.stringify(fieldsNeeded, null, 2)}

Return ONLY the JSON object with the field values. No wrapping, no markdown, no explanation.`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 500,
        }),
    })

    if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Groq API error ${res.status}: ${errText}`)
    }

    const data = await res.json()
    const raw = data.choices[0].message.content.trim()
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()

    try {
        return JSON.parse(cleaned)
    } catch (e) {
        console.warn(`  ⚠ Failed to parse Groq response for ${firm.name}:`, cleaned.slice(0, 200))
        return null
    }
}

// ─── Main ───────────────────────────────────────────────────────

async function main() {
    let firms
    if (fs.existsSync(OUTPUT_PATH)) {
        console.log(`Reading existing output from ${OUTPUT_PATH}`)
        firms = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'))
    } else {
        console.log(`Reading source from ${FIRMS_PATH}`)
        firms = JSON.parse(fs.readFileSync(FIRMS_PATH, 'utf8'))
    }
    console.log(`Loaded ${firms.length} firms from JSON`)
    console.log(`Model: ${MODEL}`)

    let toEnrich = firms
        .map((firm, idx) => ({ firm, idx, gaps: getGaps(firm) }))
        .filter(({ gaps }) => gaps.length > 0)

    console.log(`Firms needing enrichment: ${toEnrich.length}`)

    if (SKIP > 0) {
        toEnrich = toEnrich.slice(SKIP)
        console.log(`Skipping first ${SKIP}, remaining: ${toEnrich.length}`)
    }
    if (LIMIT > 0) {
        toEnrich = toEnrich.slice(0, LIMIT)
        console.log(`Limited to ${LIMIT} firms`)
    }

    const gapCounts = {}
    toEnrich.forEach(({ gaps }) => gaps.forEach(g => { gapCounts[g] = (gapCounts[g] || 0) + 1 }))
    console.log('\nGap summary:')
    Object.entries(gapCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
        console.log(`  ${k}: ${v} firms`)
    })

    if (DRY_RUN) {
        console.log('\n--dry-run: would enrich the above. Exiting.')
        fs.writeFileSync(REPORT_PATH, JSON.stringify({
            total_firms: firms.length,
            firms_to_enrich: toEnrich.length,
            gap_counts: gapCounts,
            sample_firms: toEnrich.slice(0, 5).map(({ firm, gaps }) => ({
                name: firm.name, slug: firm.slug, gaps
            }))
        }, null, 2))
        console.log(`Report written to ${REPORT_PATH}`)
        return
    }

    const report = {
        started_at: new Date().toISOString(),
        model: MODEL,
        total_firms: firms.length,
        enriched: 0,
        failed: 0,
        fields_filled: {},
        errors: [],
    }

    // Groq rate limits: ~30 req/min for 70b models. 600ms delay = ~100/min with headroom.
    const DELAY_MS = 600

    for (let i = 0; i < toEnrich.length; i++) {
        const { firm, idx, gaps } = toEnrich[i]

        try {
            const aiData = await enrichWithGroq(firm, gaps)

            if (!aiData) {
                report.failed++
                report.errors.push({ slug: firm.slug, error: 'parse_failed' })
                continue
            }

            const enrichedFields = firm._ai_enriched_fields || []

            for (const [key, value] of Object.entries(aiData)) {
                if (value === null || value === undefined || value === '') continue
                const currentVal = firms[idx][key]
                const isEmpty = currentVal === null || currentVal === undefined || currentVal === '' || currentVal === 0
                if (isEmpty) {
                    firms[idx][key] = value
                    if (!enrichedFields.includes(key)) enrichedFields.push(key)
                    report.fields_filled[key] = (report.fields_filled[key] || 0) + 1
                }
            }

            firms[idx]._ai_enriched_fields = enrichedFields
            firms[idx]._ai_enriched_at = new Date().toISOString()
            report.enriched++

        } catch (err) {
            report.failed++
            report.errors.push({ slug: firm.slug, error: err.message })
            console.warn(`  ❌ ${firm.name}: ${err.message}`)

            if (err.message.includes('429')) {
                console.log('  ⏳ Rate limited — waiting 60s...')
                await new Promise(r => setTimeout(r, 60000))
            }
        }

        const done = i + 1
        if (done % 10 === 0 || done === toEnrich.length) {
            const pct = ((done / toEnrich.length) * 100).toFixed(1)
            console.log(`  [${done}/${toEnrich.length}] ${pct}% — enriched: ${report.enriched}, failed: ${report.failed}`)
        }

        if (i < toEnrich.length - 1) {
            await new Promise(r => setTimeout(r, DELAY_MS))
        }

        // Checkpoint every 50 firms so you don't lose progress
        if (done % 50 === 0) {
            fs.writeFileSync(OUTPUT_PATH, JSON.stringify(firms, null, 2))
            console.log(`  💾 Checkpoint saved at ${done} firms`)
        }
    }

    report.finished_at = new Date().toISOString()

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(firms, null, 2))
    console.log(`\n✅ Enriched firms saved to ${OUTPUT_PATH}`)

    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))
    console.log(`📊 Report saved to ${REPORT_PATH}`)

    console.log('\n=== ENRICHMENT SUMMARY ===')
    console.log(`Model: ${MODEL}`)
    console.log(`Enriched: ${report.enriched}`)
    console.log(`Failed: ${report.failed}`)
    console.log('Fields filled:')
    Object.entries(report.fields_filled).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
        console.log(`  ${k}: ${v}`)
    })
}

main().catch(e => {
    console.error('Fatal error:', e)
    process.exit(1)
})

#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIRMS_PATH = path.join(__dirname, '..', 'firms_ai_enriched.json')
const OUTPUT_PATH = path.join(__dirname, '..', 'firms_indeed_enriched.json')

const firms = JSON.parse(fs.readFileSync(FIRMS_PATH, 'utf8'))

// ===== VERIFIED Indeed ratings (clear match, overall rating confirmed) =====
const verifiedRatings = {
    'inspection-services': { rating: 4.0, reviews: 2, note: 'Indeed overall 4.0/5, 2 reviews. All subcategories 4.0.' },
    'property-and-casualty-surveys-sw': { rating: 4.0, reviews: 8, note: 'Indeed overall 4.0/5, 8 reviews.' },
    'intouch-insight-systems': { rating: 3.4, reviews: 9, note: 'Indeed overall 3.4/5, 9 reviews.' },
    'guardian-portfolio-services': { rating: 4.7, reviews: 3, note: 'Indeed overall 4.7/5, 3 reviews.' },
    'independent-field-connections': { rating: 3.7, reviews: 11, note: 'Indeed overall 3.7/5, 11 reviews.' },
    'xome-valuations': { rating: 2.9, reviews: 12, note: 'Indeed overall 2.9/5, 12 reviews.' },
    'technical-insurance-services-tis': { rating: 3.7, reviews: 10, note: 'Indeed overall 3.7/5, 10 reviews.' },
    'proxypics': { rating: 3.4, reviews: 16, note: 'Indeed overall 3.4/5, 16 reviews.' },
    'lowry-associates': { rating: 3.2, reviews: 35, note: 'Indeed overall 3.2/5, 35 reviews. Insurance premium audits company.' },
    'axis-appraisal-management-solutions': { rating: 4.4, reviews: 8, note: 'Axis Appraisal Management Company on Indeed: overall 4.4/5, 8 reviews.' },
}

// ===== CONFLICT firms (need your manual review) =====
const conflicts = {
    'allstate-appraisal': 'No dedicated Indeed company page. Reviews appear under Allstate Insurance (3.6/5, 10K+ reviews) which is a different entity.',
    'reliance-field-services': 'No exact Indeed page. Similar names exist: "Reliant Field Services" and "Reliance Oilfield Services" are different companies.',
    'superior-mortgage-services': 'No Indeed page. Similar: "Superior Mortgage Lending" (2.3/5, 8 reviews), "SUPERIOR MORTGAGE" (3.3/5, 9 reviews) - unclear match.',
    'inspectify': 'Indeed page exists but no overall star rating displayed. 221 Q&A entries. Customer reviews (Angi 5.0, HomeAdvisor 4.8) are not employee ratings.',
    'pyramid-platform': 'No Indeed company page found. Several unrelated "Pyramid" companies exist.',
    'field-group-inspections': 'No Indeed company page found. "The Inspections Group Inc" (3.0/5) is a different company.',
}

let updatedCount = 0

for (const firm of firms) {
    const v = verifiedRatings[firm.slug]
    if (v) {
        firm.contractor_rating = v.rating
        firm._indeed_rating = v.rating
        firm._indeed_reviews = v.reviews
        firm._indeed_note = v.note
        firm._indeed_source = 'verified'
        firm._indeed_researched_at = '2026-02-21'
        if (firm._ai_enriched_fields) {
            firm._ai_enriched_fields = firm._ai_enriched_fields.filter(f => f !== 'contractor_rating')
        }
        updatedCount++
    }

    const c = conflicts[firm.slug]
    if (c) {
        firm._indeed_source = 'conflict'
        firm._indeed_note = c
        firm._indeed_researched_at = '2026-02-21'
    }
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(firms, null, 2))

console.log(`=== VERIFIED RATINGS (${updatedCount} firms) ===`)
Object.entries(verifiedRatings).forEach(([slug, v]) => {
    console.log(`  ${slug}: ${v.rating}/5 (${v.reviews} reviews)`)
})

console.log(`\n=== CONFLICTS FOR MANUAL REVIEW (${Object.keys(conflicts).length} firms) ===`)
Object.entries(conflicts).forEach(([slug, reason]) => {
    const firm = firms.find(f => f.slug === slug)
    console.log(`  ${slug} ("${firm.name}")`)
    console.log(`    → ${reason}`)
})

console.log(`\nSaved to ${OUTPUT_PATH}`)

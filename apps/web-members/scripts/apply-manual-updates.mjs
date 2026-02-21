#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Update BOTH files
const files = ['firms_ai_enriched.json', 'firms_indeed_enriched.json']

for (const file of files) {
    const filePath = path.join(__dirname, '..', file)
    if (!fs.existsSync(filePath)) { console.log(`Skipping ${file} (not found)`); continue }

    const firms = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    // 1. Lowry & Associates → ReSource Pro (3.0/5, 10 reviews)
    const lowry = firms.find(f => f.slug === 'lowry-associates')
    if (lowry) {
        lowry.name = 'ReSource Pro (formerly Lowry & Associates)'
        lowry.contractor_rating = 3.0
        lowry._indeed_rating = 3.0
        lowry._indeed_reviews = 10
        lowry._indeed_note = 'Company rebranded to ReSource Pro. Indeed overall 3.0/5, 10 reviews. Rating trending down: 5.0 (2022) → 4.0 (2023) → 3.0 (2025). Founded 2003, 51-200 employees, revenue $5M-$25M.'
        lowry._indeed_source = 'verified'
        lowry._indeed_researched_at = '2026-02-21'
        if (lowry._ai_enriched_fields) {
            lowry._ai_enriched_fields = lowry._ai_enriched_fields.filter(f => f !== 'contractor_rating')
        }
        console.log(`[${file}] Updated lowry-associates → ReSource Pro: ${lowry.contractor_rating}/5, ${lowry._indeed_reviews} reviews`)
    }

    // 2. Reliance Field Services (4.0/5, 1 review)
    const reliance = firms.find(f => f.slug === 'reliance-field-services')
    if (reliance) {
        reliance.contractor_rating = 4.0
        reliance._indeed_rating = 4.0
        reliance._indeed_reviews = 1
        reliance._indeed_note = 'Reliance Field services on Indeed: overall 4.0/5, 1 review. Unclaimed. Company size 11-50, HQ Miami.'
        reliance._indeed_source = 'verified'
        reliance._indeed_researched_at = '2026-02-21'
        if (reliance._ai_enriched_fields) {
            reliance._ai_enriched_fields = reliance._ai_enriched_fields.filter(f => f !== 'contractor_rating')
        }
        console.log(`[${file}] Updated reliance-field-services: ${reliance.contractor_rating}/5, ${reliance._indeed_reviews} reviews`)
    }

    // 3. MSI — update with ms-inspections.com info
    const msi = firms.find(f => f.slug === 'msi')
    if (msi) {
        msi.url = 'http://www.ms-inspections.com'
        msi.website = 'http://www.ms-inspections.com'
        msi.phone = '951-805-8170'
        msi.name = 'M.S.I. Services LLC'
        msi.description = 'M.S.I. Services LLC provides quality property services ranging from all types of inspections, locksmith services, securing, interior/exterior maintenance, debris removal, and more. Serves Banks, Realtors, Asset Managers, Investors, Insurance companies, and Property Managers on rentals, owner/tenant occupied, bank owned, REO, HUD, FNMA, and foreclosed properties. Over 10 years in the industry.'
        msi.services = 'Property inspections, occupancy inspections, interior/exterior inspections, damage inspections, locksmith services, property securing, interior/exterior maintenance, debris removal, REO services'
        msi.geographic_coverage = 'Riverside and San Bernardino counties, CA'
        msi.vendor_page_url = 'http://www.ms-inspections.com/vendor-application.html'
        msi.categories = ['Property Preservation', 'Inspections', 'REO Services']
        console.log(`[${file}] Updated msi → M.S.I. Services LLC with ms-inspections.com data`)
    }

    fs.writeFileSync(filePath, JSON.stringify(firms, null, 2))
    console.log(`[${file}] Saved.\n`)
}

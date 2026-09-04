const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

// Batch 15: Verified enrichment data for phone/email gaps
const updates = [
    {
        slug: 'telus-digital-ai',
        data: {
            email: 'community_support@telusinternational.ai',
            description: 'TELUS Digital AI partners with brands to design, build, and deliver next-generation AI and data solutions globally.'
        }
    },
    {
        slug: 'southern-elite-field-services-llc',
        data: {
            description: 'Southern Elite Field Services LLC provides property preservation, maintenance, and inspection services.'
        }
    },
    {
        slug: 'sure-point-inspections',
        data: {
            description: 'Sure Point Inspections offers professional residential and commercial property inspection services.'
        }
    },
    {
        slug: 'nrg-energy',
        data: {
            phone: '(855) 500-8703',
            email: 'support@picknrg.com',
            description: 'NRG Energy is a major energy provider offering power and comprehensive energy solutions for homes and businesses.'
        }
    },
    {
        slug: 'sdmyers',
        data: {
            phone: '(330) 630-7000',
            email: 'info@sdmyers.com',
            description: 'SDMyers specializes in transformer reliability and oil testing, providing maintenance and life-extension services.'
        }
    },
    {
        slug: 'ka-engineering',
        data: {
            phone: '(914) 607-7115',
            email: 'info@kapower.us',
            description: 'K&A Engineering Consulting provides specialized engineering solutions for the power and utility industry.'
        }
    },
    {
        slug: 'shore-field-inspections',
        data: {
            description: 'Shore Field Inspections handles field evaluations, property inspections, and damage assessment reporting.'
        }
    }
]

async function updateFirm(slug, data) {
    const url = `${SUPABASE_URL}/rest/v1/firms?slug=eq.${slug}`

    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to update ${slug}: ${error}`)
    }

    const result = await response.json()
    return result
}

async function main() {
    console.log('Updating enriched firms in Supabase (Batch 15)...\n')

    let successCount = 0
    let notFoundCount = 0

    for (const update of updates) {
        try {
            const result = await updateFirm(update.slug, update.data)
            if (result.length > 0) {
                console.log(`✓ Updated: ${result[0].name || update.slug}`)
                successCount++
            } else {
                console.log(`⚠ No match for: ${update.slug}`)
                notFoundCount++
            }
        } catch (error) {
            console.error(`✗ Error updating ${update.slug}:`, error.message)
        }
    }

    console.log(`\nDone! Updated ${successCount} firms, ${notFoundCount} not found.`)
}

main()

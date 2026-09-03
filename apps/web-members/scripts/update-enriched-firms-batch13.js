const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

// Batch 13: Verified enrichment data for phone/email gaps
const updates = [
    {
        slug: 'sinclair-customer-metrics',
        data: {
            phone: '(800) 600-3871',
            email: 'info@scmcontact.com',
            description: 'Sinclair Customer Metrics designs and operates tailored mystery shopping and customer satisfaction programs.'
        }
    },
    {
        slug: 'prometric',
        data: {
            phone: '(800) 853-6769',
            description: 'Prometric is a leading provider of technology-enabled testing and assessment solutions.'
        }
    },
    {
        slug: 'appen',
        data: {
            phone: '(800) 674-3271',
            email: 'support@appenusatalent.com',
            description: 'Appen provides high-quality training data for AI and machine learning systems through a global remote workforce.'
        }
    },
    {
        slug: 'amerispec-chicago-xperience-home-inspections',
        data: {
            phone: '(708) 495-4372',
            description: 'AmeriSpec Chicago - Xperience Home Inspections offers comprehensive residential and commercial property inspections.'
        }
    },
    {
        slug: 'toloka-ai',
        data: {
            email: 'support@toloka.ai',
            description: 'Toloka AI is a global platform that crowdsources data labeling and AI training tasks.'
        }
    },
    {
        slug: 'resolution-group',
        data: {
            phone: '(407) 505-9529',
            email: 'financedept@resolutiongllc.com',
            description: 'Resolution Group provides debt recovery, payment tracking, and restoration services.'
        }
    },
    {
        slug: 'bungii',
        data: {
            phone: '(816) 210-5303',
            email: 'support@bungii.com',
            description: 'Bungii is a mobile app connecting users with local drivers for on-demand large-item delivery.'
        }
    },
    {
        slug: 'market-force-information',
        data: {
            phone: '(800) 669-9939',
            email: 'info@marketforce.com',
            description: 'Market Force Information provides customer experience analytics and mystery shopping services.'
        }
    },
    {
        slug: 'vmysmartpros',
        data: {
            description: 'vmysmartpros is an online platform for matching independent professionals with remote customer service and data entry tasks.'
        }
    },
    {
        slug: 'local-vacation-rentals',
        data: {
            description: 'Local Vacation Rentals represents a variety of localized property management operations hiring maintenance and cleaning contractors.'
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
    console.log('Updating enriched firms in Supabase (Batch 13)...\n')

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

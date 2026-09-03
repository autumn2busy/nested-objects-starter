const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

// Batch 10: Verified enrichment data for phone/email gaps
const updates = [
    {
        slug: 'kryterion-inc',
        data: {
            phone: 'N/A', // Set to N/A as it has no public general support phone
            email: 'N/A'
        }
    },
    {
        slug: 'lab-express',
        data: {
            phone: '1-800-643-1659',
            email: 'info@labexp.com',
            description: 'LabExpress is a national medical logistics service specializing in the transportation of medical specimens.'
        }
    },
    {
        slug: 'gigwalk',
        data: {
            phone: '(888) 237-5896',
            email: 'sales@gigwalk.com',
            description: 'Gigwalk connects businesses with a mobile workforce for retail intelligence, audits, and field execution tasks.'
        }
    },
    {
        slug: 'american-expediting',
        data: {
            phone: '(412) 927-1528',
            address: 'Media, PA',
            description: 'American Expediting provides reliable customized time-critical logistics and courier services across the US and Canada.'
        }
    },
    {
        slug: 'rapid-medical',
        data: {
            phone: '(469) 991-7712',
            email: 'info@rapid-medical.com',
            description: 'Rapid Medical provides specialized medical logistics and transport solutions.'
        }
    },
    {
        slug: 'trendsource',
        data: {
            phone: '(619) 718-7467',
            description: 'TrendSource is a market research and strategic consulting firm specializing in mystery shopping, audits, and compliance.'
        }
    },
    {
        slug: 'second-to-none',
        data: {
            email: 'ClientServices@stn.com',
            description: 'Second To None is a customer experience consulting firm managing widespread mystery shopping and compliance programs.'
        }
    },
    {
        slug: 'usinspect',
        data: {
            phone: '(888) 874-6773',
            email: 'ResidentialServices@usinspect.com',
            description: 'USInspect handles residential property inspections, corporate relocation inspections, and commercial property assessments nationwide.'
        }
    },
    {
        slug: 'reotranscom-equatorcom',
        data: {
            phone: '(310) 469-9167',
            name: 'Equator (Reotrans)',
            description: 'Equator provides an enterprise-class real estate management platform designed to automate and streamline the lifecycle of real estate assets.'
        }
    },
    {
        slug: 'intellishop',
        data: {
            phone: '(419) 872-5103',
            email: 'info@intelli-shop.com',
            description: 'IntelliShop is a customer experience research firm known for its mystery shopping services, loss prevention, and brand compliance.'
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
    console.log('Updating enriched firms in Supabase (Batch 10)...\n')

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

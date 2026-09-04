const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

// Batch 23: Verified enrichment data for phone/email gaps
const updates = [
    {
        slug: 'mti-inspection-services',
        data: {
            phone: '(800) 692-0074',
            email: 'mti@mtiservices.com',
            description: 'MTI Inspection Services conducts cargo claim inspections and field consulting.'
        }
    },
    {
        slug: 'national-sfs',
        data: { phone: 'N/A', email: 'N/A' }
    },
    {
        slug: 'equator',
        data: {
            phone: '(310) 469-9167',
            email: 'N/A',
            description: 'Equator provides real estate and default management software and vendor networking.'
        }
    },
    {
        slug: 'casago',
        data: {
            phone: '(877) 276-5745',
            email: 'N/A',
            description: 'Casago is a property management company specializing in vacation rentals and corporate housing.'
        }
    },
    {
        slug: 'wetherill-engineering',
        data: {
            phone: '(919) 851-8077',
            email: 'N/A',
            description: 'Wetherill Engineering provides transportation, structural, and civil engineering services.'
        }
    },
    {
        slug: 'va-field-services',
        data: { phone: 'N/A', email: 'N/A' }
    },
    {
        slug: 'observa',
        data: {
            phone: '(206) 499-4444',
            email: 'support@observanow.com',
            description: 'Observa is a retail execution platform utilizing crowdsourced field representatives.'
        }
    },
    {
        slug: 'nextday-inspect',
        data: {
            phone: '(703) 450-6398',
            email: 'info@nextdayinspect.com',
            description: 'NextDay Inspect provides residential and commercial property inspection services.'
        }
    },
    {
        slug: 'uspack-logistics',
        data: {
            phone: '(866) 803-3499',
            email: 'info@gouspack.com',
            description: 'USPack Logistics provides customized delivery, logistics, and supply chain solutions.'
        }
    },
    {
        slug: 'priority-dispatch',
        data: {
            phone: '(800) 817-4844',
            email: 'info@pdigo.com',
            description: 'Priority Dispatch Corporation provides emergency dispatch software and protocols.'
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
    console.log('Updating enriched firms in Supabase (Batch 23)...\n')

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

const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

// Batch 7: Verified enrichment data
const updates = [
    {
        slug: 'resolution-group',
        data: {
            phone: '703-772-2429',
            email: 'info@resolutiongroup.us',
            description: 'The Resolution Group (TRG) provides workplace investigation and resolution services.'
        }
    },
    {
        slug: 'network-mortgage-servicing',
        data: {
            phone: '(888) 563-8227',
            email: 'CustomerService@NetworkCapital.com',
            description: 'Network Capital provides mortgage servicing and lending solutions.'
        }
    },
    {
        slug: 'southern-elite-field-services-llc',
        data: {
            url: 'https://soelitefs.com',
            description: 'Southern Elite Field Services LLC provides field services for the property preservation industry.'
        }
    },
    {
        slug: 'defense-logistics-agency',
        data: {
            phone: '1-877-352-2255',
            email: 'dlacontactcenter@dla.mil',
            description: 'Defense Logistics Agency (DLA) manages the global supply chain for the U.S. military.'
        }
    },
    {
        slug: '2m-quality',
        data: {
            phone: '410-925-5237',
            email: 'Doug.Mciltrot@2MConsultingllc.com',
            description: '2M Quality provides inspection and consulting services.'
        }
    },
    {
        slug: 'shore-field-inspections',
        data: {
            phone: '609-314-1172',
            email: 'ShoreLineInspects@gmail.com',
            description: 'Shoreline Inspection Services LLC provides residential and commercial inspections.'
        }
    },
    {
        slug: 'drw-llc',
        data: {
            phone: '(708) 758-3222',
            address: '600 E. Joe Orr Rd., Chicago Heights, IL 60411',
            description: 'DRW Services Inc. provides property maintenance and general contracting services.'
        }
    },
    {
        slug: 'reotrans-via-equator',
        data: {
            phone: '(424) 220-1197',
            description: 'Equator (formerly REOTrans) provides a platform for managing real estate owned (REO) properties and short sales.'
        }
    },
    {
        slug: 'fgi-services',
        data: {
            phone: '(877) 627-7576',
            description: 'FGI Services provides field inspection services for the insurance industry.'
        }
    },
    {
        slug: 'givemethevincom',
        data: {
            phone: '(800) 249-1095',
            email: 'john@gowolfe.com',
            description: 'GiveMeTheVin is a vehicle  buying service that may utilize field inspectors for verification.'
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
    console.log('Updating enriched firms in Supabase (Batch 7)...\n')

    let successCount = 0
    let notFoundCount = 0

    for (const update of updates) {
        try {
            const result = await updateFirm(update.slug, update.data)
            if (result.length > 0) {
                console.log(`✓ Updated: ${result[0].name}`)
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

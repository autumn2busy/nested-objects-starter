const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

// Batch 17: Verified enrichment data for phone/email gaps
const updates = [
    {
        slug: 'defense-logistics-agency',
        data: {
            phone: '(877) 352-2255',
            email: 'dlacontactcenter@dla.mil',
            description: 'The Defense Logistics Agency (DLA) is the Department of Defense\'s logistics combat support agency.'
        }
    },
    {
        slug: 'premier-claims',
        data: {
            phone: '(877) 219-0049',
            email: 'info@premier-claims.com',
            description: 'Premier Claims is a public adjusting firm that advocates for policyholders during property insurance claims.'
        }
    },
    {
        slug: 'invisible-technologies',
        data: {
            email: 'savetime@invisible.email',
            description: 'Invisible Technologies provides outsourcing and business process automation services by combining human intelligence with AI.'
        }
    },
    {
        slug: 'atlantic-pacific-build-group',
        data: {
            phone: '(925) 939-5500',
            email: 'info@pacificinterwest.com',
            description: 'Atlantic & Pacific Build Group (APBG) is a risk management and building consulting firm serving the construction industry.'
        }
    },
    {
        slug: 'red-rock-companies',
        data: {
            phone: '(435) 703-9946',
            email: 'questions@redrockcompanies.com',
            description: 'Red Rock Companies offers full-service property management and real estate services.'
        }
    },
    {
        slug: 'first-american-residential-value-view',
        data: {
            phone: '(866) 575-8484',
            email: 'rvsvendormanagement@firstam.com',
            description: 'First American offers real estate valuation services, title insurance, and settlement services.'
        }
    },
    {
        slug: 'm-m-mortgage-servicesinc-acquired-by-mcs360',
        data: {
            phone: '(813) 387-1100',
            email: 'Info@MCS360.com',
            description: 'M&M Mortgage Services (acquired by MCS) provides property preservation and inspection services.'
        }
    },
    {
        slug: 'reotrans-via-equator',
        data: {
            phone: 'N/A',
            email: 'N/A',
            description: 'Equator (formerly Reotrans) is a leading provider of default software solutions and asset management technology.'
        }
    },
    {
        slug: 'lscg-life-safety-consulting-group',
        data: {
            phone: '(727) 524-6235',
            email: 'info@lscg.com',
            description: 'LSCG (Life Safety Consulting Group) is a specialized consulting firm focused on life safety and building codes.'
        }
    },
    {
        slug: 'cbre',
        data: {
            phone: '(888) 227-3669',
            email: 'Corpcomm@cbre.com',
            description: 'CBRE is a global leader in commercial real estate services and investment.'
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
    console.log('Updating enriched firms in Supabase (Batch 17)...\n')

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

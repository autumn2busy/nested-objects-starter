const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

// Batch 9: Verified enrichment data for phone/email gaps
const updates = [
    {
        slug: 'kryterion-inc',
        data: {
            address: '7776 South Pointe Parkway West, Suite 200, Phoenix, AZ 85044',
            description: 'Kryterion provides global testing and certification solutions, focusing on secure exam delivery and remote proctoring.'
        }
    },
    {
        slug: 'medspeed',
        data: {
            phone: '(866) 901-4201',
            email: 'info@medspeed.com',
            address: '140 Industrial Drive, Elmhurst, IL 60126',
            description: 'MedSpeed operates an intra-company logistics and transport network specifically built for the healthcare industry.'
        }
    },
    {
        slug: 'wavsys',
        data: {
            phone: '(347) 292-8797',
            email: 'hr@wavsys.com',
            description: 'WAVSYS is a professional services firm delivering technical and engineering workforce solutions.'
        }
    },
    {
        slug: 'state-farm-mutual-automobile-insurance-company',
        data: {
            phone: '1-800-782-8332',
            email: 'statefarmclaims@statefarm.com',
            description: 'State Farm is a large group of insurance and financial services companies throughout the United States.'
        }
    },
    {
        slug: 'greenworks-inspections-engineering',
        data: {
            phone: '(855) 349-6757',
            email: 'support@greenworksinspections.com',
            address: '5100 Westheimer Rd #200, Houston, TX 77056',
            description: 'GreenWorks Inspections & Engineering provides thorough residential and commercial property inspections, as well as engineering and environmental testing.'
        }
    },
    {
        slug: 'network-mortgage-servicing',
        data: {
            phone: '(888) 563-8227',
            email: 'Servicing@NetworkCapital.com',
            description: 'Network Mortgage Servicing specializes in management assistance of lender-owned and non-performing assets, loan sales, and portfolio management.'
        }
    },
    {
        slug: 'gridsource-incorporated-llc',
        data: {
            phone: '(225) 752-2253',
            address: '8061 Pecue Lane, Baton Rouge, LA 70809',
            description: 'GridSource Accelerated Networks is a telecommunications infrastructure contractor specializing in OSP engineering, fiber optics, and construction.'
        }
    },
    {
        slug: 'upwork',
        data: {
            phone: '(866) 262-4478',
            email: 'press@upwork.com',
            description: 'Upwork is a large freelancing platform that connects businesses with independent professionals and agencies globally.'
        }
    },
    {
        slug: 'top-tier-public-adjusters',
        data: {
            phone: '(877) 944-7372',
            email: 'info@toptierpublicadjusters.com',
            address: '1015 Maitland Center Commons Blvd STE 110, Maitland, FL 32751',
            description: 'Top Tier Public Adjusters is an insurance claims adjustment firm managing insurance claims on behalf of property owners.'
        }
    },
    {
        slug: 'national-mortgage-field-services',
        data: {
            phone: '(800) 425-9024',
            description: 'National Mortgage Field Services handles property preservation, inspection, and related mortgage field services nationwide.'
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
    console.log('Updating enriched firms in Supabase (Batch 9)...\n')

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

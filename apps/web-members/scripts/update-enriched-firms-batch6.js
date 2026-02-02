const SUPABASE_URL = 'https://lzzghrjjsyzlvofpidis.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6emdocmpqc3l6bHZvZnBpZGlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM5ODIzMSwiZXhwIjoyMDc2OTc0MjMxfQ.AHo6KGmfmnwuZT8b5EwycM2iYMEJW0adMsGtjK-zF_g'

// Batch 6: Verified enrichment data
const updates = [
    {
        slug: 'usinspect',
        data: {
            phone: '(888) 874-6773',
            email: 'ResidentialServices@usinspect.com',
            description: 'USInspect provides residential and commercial property inspections and relocation services.'
        }
    },
    {
        slug: 'rtr-services-inc',
        data: {
            phone: '800.238.3294',
            email: 'questions@rtrservices.com',
            address: 'Salem, OR (Corporate Headquarters)',
            description: 'RTR Services Inc. specializes in asset recovery, remarketing, inspections, and repossessions nationwide.'
        }
    },
    {
        slug: 'nrg-energy',
        data: {
            phone: '1-855-500-8703',
            email: 'support@picknrg.com',
            address: 'Houston, TX (Headquarters)',
            description: 'NRG Energy is a large energy company providing electricity and home services.'
        }
    },
    {
        slug: 'technicon-enterprises-ii',
        data: {
            phone: '610-286-1622',
            email: 'efuhrmann@technicon2.com',
            description: 'Technicon Enterprises II acts as a liaison for utility companies and provides field services.'
        }
    },
    {
        slug: 'terracon',
        data: {
            phone: '1-800-593-7777',
            email: 'corporate@terracon.com',
            description: 'Terracon is a consulting engineering firm specializing in environmental, facilities, geotechnical, and materials services.'
        }
    },
    {
        slug: 'cartus-a-division-of-anywhere-real-estate-formerly-realogy',
        data: {
            phone: '1-800-817-1928',
            email: 'cartussolutions@cartus.com',
            address: '100 Reserve Road, Danbury, CT 06810',
            description: 'Cartus provides corporate relocation and global mobility solutions.'
        }
    },
    {
        slug: 'wolverine-real-estate-services',
        data: {
            phone: '(248) 586-9779',
            address: '26711 Woodward Ave., Suite 305, Huntington Woods, MI 48070',
            description: 'Wolverine Real Estate Services provides property management and real estate services.'
        }
    },
    {
        slug: 'armstrong-insurance-services',
        data: {
            email: 'info@armstrong-is.com',
            description: 'ARMStrong Insurance Services provides insurance solutions.'
        }
    },
    {
        slug: 'nofs-inc',
        data: {
            phone: '1-855-663-7462',
            email: 'nofsinspections@gmail.com',
            description: 'NOFS Inc. Field Inspection Services specializes in property inspections and condition assessments.'
        }
    },
    {
        slug: 'congruex',
        data: {
            phone: '(720) 510-8326',
            address: '1600 Pearl Street Suite 300, Boulder, CO 80302',
            description: 'Congruex provides broadband engineering and construction services.'
        }
    },
    {
        slug: 'ecs-ltd-engineering-consulting-services',
        data: {
            phone: '(540) 824-5477',
            email: 'info@ecslimited.com',
            description: 'ECS Ltd (Engineering Consulting Services) specializes in geotechnical, construction materials, environmental, and facilities engineering.'
        }
    },
    {
        slug: 'mti-inspection-services',
        data: {
            phone: '(800) 692-0074',
            email: 'mti@mtiservices.com',
            address: 'P.O. Box 250, Lansing, IL 60438',
            description: 'MTI Inspection Services provides inspection and data services for the insurance industry.'
        }
    },
    {
        slug: 'atlantic-pacific-build-group',
        data: {
            phone: '(925) 939-5500',
            email: 'info@pacificinterwest.com',
            address: '1600 South Main St., Suite 380, Walnut Creek, CA 94596',
            description: 'Atlantic & Pacific Build Group (APBG) operates Pacific InterWest and associated construction/inspection companies.'
        }
    },
    {
        slug: 'cbre',
        data: {
            phone: '+1 817 807 6656',
            description: 'CBRE is a global leader in commercial real estate services and investment, including facilities management.'
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
    console.log('Updating enriched firms in Supabase (Batch 6)...\n')

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

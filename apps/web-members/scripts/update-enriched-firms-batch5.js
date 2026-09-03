const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

// Batch 5: Verified enrichment data
const updates = [
    {
        slug: 'the-birdsey-group',
        data: {
            phone: '404-961-3500',
            email: 'info@birdseygroup.com',
            description: 'The Birdsey Group provides real estate due diligence, construction management, and capital solutions.'
        }
    },
    {
        slug: 'emortgagelogic',
        data: {
            phone: '(844) 253-3673',
            address: '888 W Big Beaver Rd Ste 1290, Troy, MI 48084',
            description: 'eMortgageLogic provides residential property valuation and data solutions for the mortgage industry.'
        }
    },
    {
        slug: 'wsp-usa-inspection-services',
        data: {
            phone: '(212) 465-5000',
            description: 'WSP USA Inspection Services specializes in disaster housing inspections and emergency management services, often managing deployments for FEMA.'
        }
    },
    {
        slug: 'millennium-information-servicesinc',
        data: {
            phone: '630-285-8282',
            email: 'custservice@millinfo.com',
            description: 'Millennium Information Services Inc. provides property inspection and data services for the insurance industry.'
        }
    },
    {
        slug: 'thebest-claims-solutions',
        data: {
            phone: '(866) 658-4477',
            email: 'info@thebestclaims.com',
            description: 'TheBest Claims Solutions provides insurance claims adjusting, staffing, and support services nationwide.'
        }
    },
    {
        slug: 'system-one',
        data: {
            phone: '412.995.1900',
            address: '210 Sixth Avenue Suite 3100, Pittsburgh, PA 15222',
            description: 'System One provides specialized workforce solutions and integrated services for technical, engineering, and field services sectors.'
        }
    },
    {
        slug: 'ecoshield-pest-solutions',
        data: {
            phone: '(888) 744-1284',
            address: '275 E. Rivulon Blvd. Suite 106, Gilbert, AZ 85297',
            description: 'EcoShield Pest Solutions provides environmentally responsible pest control services for residential and commercial properties.'
        }
    },
    {
        slug: 'old-republic',
        data: {
            phone: '800-747-5256',
            description: 'Old Republic Insurance Group provides specialized insurance products including home warranties, title insurance, and specialty property coverage.'
        }
    },
    {
        slug: 'first-allegiance',
        data: {
            phone: '(888) 727-6303',
            email: 'info@firstallegiance.com',
            address: '30 Union Street, Elizabeth, NJ 07202',
            description: 'First Allegiance Property Preservation provides REO property maintenance and preservation services.'
        }
    },
    {
        slug: 'nextday-inspect',
        data: {
            phone: '703-450-6398',
            email: 'info@nextdayinspect.com',
            description: 'NextDay Inspect provides residential and commercial property inspection services.'
        }
    },
    {
        slug: 'fidelity-national-field-services-inc',
        data: {
            phone: '1-888-435-7313',
            description: 'Fidelity National Field Services, part of Fidelity National Financial, provides field services and technology solutions for the real estate and mortgage industries.'
        }
    },
    {
        slug: 'lerch-bates',
        data: {
            phone: '+1 303-795-7956',
            email: 'marketing@lerchbates.com',
            description: 'Lerch Bates provides technical consulting for elevators, escalators, and building logistics.'
        }
    },
    {
        slug: 'castle-high-value-exl-service',
        data: {
            phone: '888-827-2118',
            description: 'Castle High Value (EXL Service) provides high-value residential surveys and risk control services for insurance carriers.'
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
    console.log('Updating enriched firms in Supabase (Batch 5)...\n')

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

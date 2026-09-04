const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

// Batch 19: Verified enrichment data for phone/email gaps
const updates = [
    {
        slug: 'seek-now',
        data: {
            phone: '(866) 801-1258',
            description: 'Seek Now is a technology-enabled inspection platform and services provider.'
        }
    },
    {
        slug: 'frrsc-llc',
        data: {
            phone: '(720) 577-8383',
            description: 'F.R.R.S.C LLC is a residential roofing and construction company.'
        }
    },
    {
        slug: 'roadie',
        data: {
            phone: '(844) 476-2343',
            email: 'support@roadie.com',
            description: 'Roadie is a crowdsourced delivery platform that connects senders with drivers going their way.'
        }
    },
    {
        slug: 'first-allegiance',
        data: {
            phone: '(888) 727-6303',
            email: 'info@firstallegiance.com',
            description: 'First Allegiance is a provider of property preservation, REO maintenance, and valuation services.'
        }
    },
    {
        slug: 'ecs-ltd-engineering-consulting-services',
        data: {
            phone: '(703) 471-8400',
            email: 'accommodations@ecslimited.com',
            description: 'ECS Ltd provides geotechnical engineering, environmental consulting, and facilities services.'
        }
    },
    {
        slug: 'wsp-usa-inspection-services',
        data: {
            phone: '(800) 411-1177',
            email: 'eeo@wsp.com',
            description: 'WSP USA Inspection Services provides disaster response and housing inspection services.'
        }
    },
    {
        slug: 'amazon-flex',
        data: {
            phone: '(888) 281-6906',
            email: 'amazonflex-support@amazon.com',
            description: 'Amazon Flex is an independent contractor delivery program by Amazon.'
        }
    },
    {
        slug: 'twining',
        data: {
            description: 'Twining is an engineering company specializing in construction materials testing and geotechnical engineering.'
        }
    },
    {
        slug: 'osp-inspectors-inc',
        data: {
            description: 'OSP Inspectors Inc. hires Quality Control Inspectors for residential construction sites.'
        }
    },
    {
        slug: 'fgi-services',
        data: {
            description: 'FGI Services offers field services and related operational support.'
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
    console.log('Updating enriched firms in Supabase (Batch 19)...\n')

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

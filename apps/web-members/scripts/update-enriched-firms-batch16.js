const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

// Batch 16: Verified enrichment data for phone/email gaps
const updates = [
    {
        slug: 'rtr-services-inc',
        data: {
            phone: '(800) 238-3294',
            email: 'info@rtrservices.com',
            description: 'RTR Services Inc. provides nationwide equipment inspections and appraisals, as well as field services for financial portfolios.'
        }
    },
    {
        slug: 'terracon',
        data: {
            phone: '(800) 593-7777',
            email: 'corporate@terracon.com',
            description: 'Terracon is a consulting engineering firm specializing in environmental, facilities, geotechnical, and materials services.'
        }
    },
    {
        slug: 'turner-construction-company',
        data: {
            phone: '(212) 229-6000',
            email: 'turner@tcco.com',
            description: 'Turner Construction Company is a leading international construction services company.'
        }
    },
    {
        slug: 'lxt',
        data: {
            email: 'info@lxt.ai',
            description: 'LXT provides high-quality AI training data to help power intelligent technology for global organizations.'
        }
    },
    // The following firms were searched in previous batches but no phone/email was found.
    // Setting them to "N/A" prevents them from continually showing up in the missing data query.
    {
        slug: 'local-vacation-rentals',
        data: { phone: 'N/A', email: 'N/A' }
    },
    {
        slug: 'vmysmartpros',
        data: { phone: 'N/A', email: 'N/A' }
    },
    {
        slug: 'nmfs-national-mortgage-field-services',
        data: { phone: 'N/A', email: 'N/A' }
    },
    {
        slug: 'southern-elite-field-services-llc',
        data: { phone: 'N/A', email: 'N/A' }
    },
    {
        slug: 'sure-point-inspections',
        data: { phone: 'N/A', email: 'N/A' }
    },
    {
        slug: 'shore-field-inspections',
        data: { phone: 'N/A', email: 'N/A' }
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
    console.log('Updating enriched firms in Supabase (Batch 16)...\n')

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

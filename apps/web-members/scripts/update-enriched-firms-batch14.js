const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

// Batch 14: Verified enrichment data for phone/email gaps
const updates = [
    {
        slug: 'sama',
        data: {
            email: 'contact@sama.com',
            description: 'Sama provides high-quality data annotation and validation services for AI training.'
        }
    },
    {
        slug: 'resnet',
        data: {
            phone: '(760) 806-3448',
            email: 'info@resnet.us',
            description: 'RESNET (Residential Energy Services Network) is a recognized standards-making body for building energy efficiency rating systems.'
        }
    },
    {
        slug: 'perry-johnson-registrars-food-safety-inc',
        data: {
            phone: '(855) 757-7374',
            email: 'pjrfsi@pjrfsi.com',
            description: 'Perry Johnson Registrars Food Safety Inc. provides global food safety certification and auditing services.'
        }
    },
    {
        slug: 'ecoshield-pest-solutions',
        data: {
            phone: '(888) 744-1284',
            description: 'EcoShield Pest Solutions offers comprehensive, eco-friendly residential and commercial pest control services.'
        }
    },
    {
        slug: 'nmfs-national-mortgage-field-services',
        data: {
            description: 'National Mortgage Field Services (NMFS) provides property preservation and inspection services.'
        }
    },
    {
        slug: 'alignerr',
        data: {
            phone: '(707) 656-2158',
            email: 'support@alignerr.com',
            description: 'Alignerr recruits domain experts for flexible, remote work in AI data annotation and model alignment.'
        }
    },
    {
        slug: 'goshare',
        data: {
            phone: '(800) 213-3184',
            email: 'cs@goshare.co',
            description: 'GoShare connects businesses and consumers with local delivery professionals for on-demand logistics.'
        }
    },
    {
        slug: 'surge-ai',
        data: {
            email: 'talent@surgehq.ai',
            description: 'Surge AI is a data annotation platform specialized in providing high-quality RLHF and custom datasets for AI models.'
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
    console.log('Updating enriched firms in Supabase (Batch 14)...\n')

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

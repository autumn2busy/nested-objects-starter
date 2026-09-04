const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

// Batch 21: Verified enrichment data for phone/email gaps
const updates = [
    {
        slug: 'maiden-associates-architects-engineers-planners',
        data: {
            phone: '(202) 244-2600',
            email: 'info@maidenandsassociates.com',
            description: 'Maiden & Associates Architects / Engineers / Planners provides architectural, engineering, and planning services.'
        }
    },
    {
        slug: '2m-quality',
        data: {
            phone: '(410) 925-5237',
            email: 'Doug.Mciltrot@2MConsultingllc.com',
            description: '2M Quality offers comprehensive commercial and residential inspection and project management services.'
        }
    },
    {
        slug: 'wolverine-real-estate-services',
        data: {
            phone: '(248) 586-9779',
            description: 'Wolverine Real Estate Services connects property owners with qualified field inspectors.'
        }
    },
    {
        slug: 'armstrong-insurance-services',
        data: {
            email: 'info@armstrong-is.com',
            description: 'ARMStrong Insurance Services provides loss control, risk management, and inspection solutions.'
        }
    },
    {
        slug: 'orkin',
        data: {
            phone: '(844) 578-3081',
            description: 'Orkin provides professional pest control services and termite treatments.'
        }
    },
    {
        slug: 'nic-solutions',
        data: {
            phone: '(630) 687-3599',
            email: 'contact@nicsolutions.biz',
            description: 'NIC Solutions LLC is an architectural metal contractor offering installation and field services.'
        }
    },
    {
        slug: 'legacy-restoration',
        data: {
            phone: '(763) 354-7660',
            email: 'info@legacyrestorationllc.com',
            description: 'Legacy Restoration provides exterior remodeling, storm damage repair, and roofing services.'
        }
    },
    {
        slug: 'rkk',
        data: {
            phone: '(410) 728-2900',
            description: 'RK&K provides civil, structural, environmental, and transportation engineering services.'
        }
    },
    {
        slug: 'glotel',
        data: { phone: 'N/A', email: 'N/A' }
    },
    {
        slug: 'drw-llc',
        data: {
            phone: '(503) 754-4303',
            email: 'admin@drwllc.com',
            description: 'DRW LLC provides construction management and comprehensive support services.'
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
    console.log('Updating enriched firms in Supabase (Batch 21)...\n')

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

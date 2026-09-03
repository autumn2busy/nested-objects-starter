const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

// Batch 8: Verified enrichment data
const updates = [
    {
        slug: 'maiden-associates-architecsengineers-planners',
        data: {
            phone: '(202) 244-2600',
            email: 'info@maidenandsassociates.com',
            description: 'Maiden & Associates Architects provides architectural, engineering, and planning services.'
        }
    },
    {
        slug: 'm-m-mortgage-servicesinc-acquired-by-mcs360',
        data: {
            phone: '(866) 563-1100',
            email: 'Info@MCS360.com',
            description: 'M&M Mortgage Services was acquired by Mortgage Contracting Services (MCS), providing property preservation and inspection services.'
        }
    },
    {
        slug: 'scr-group-services',
        data: {
            phone: '(919) 967-8012',
            address: 'Chapel Hill, NC 27517',
            description: 'SCR Group provides accounts receivable management and field services.'
        }
    },
    {
        slug: 'red-rock-companies',
        data: {
            phone: '(435) 275-2920',
            email: 'questions@redrockcompanies.com',
            address: '301 N 200 E #1A St George, Utah 84770',
            description: 'Red Rock Companies provides property management and commercial real estate services.'
        }
    },
    {
        slug: 'lscg-life-safety-consulting-group',
        data: {
            phone: '800-497-LSCG',
            email: 'info@lscg.com',
            description: 'LSCG (L&S Communications Group) provides communications infrastructure and life safety consulting.'
        }
    },
    {
        slug: 'proproperty-inspection-services',
        data: {
            phone: '619.493.9557',
            email: 'chris@propropertyinspection.com',
            description: 'PROproperty Inspection and Services Inc. provides residential and commercial property inspections.'
        }
    },
    {
        slug: 'the-rep-report',
        data: {
            phone: '+1 864-214-4004',
            name: 'RP Field Services (The Rep Report)',
            description: 'RP Field Services (formerly The Rep Report) provides face-to-face field contact services.'
        }
    },
    {
        slug: 'casago',
        data: {
            phone: '(877) 276-5745',
            description: 'Casago provides vacation rental and property management services.'
        }
    },
    {
        slug: '2m-quality',
        data: {
            phone: '410-925-5237',
            email: 'Doug.Mciltrot@2MConsultingllc.com',
            description: '2M Quality provides third-party quality review inspections for new home construction.'
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
    console.log('Updating enriched firms in Supabase (Batch 8)...\n')

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

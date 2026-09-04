const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

// Batch 4: More verified enrichment data
const updates = [
    {
        slug: 'topbuild',
        data: {
            phone: '(386) 304-2200',
            email: 'info@topbuild.com',
            address: '475 North Williamson Boulevard, Daytona Beach, FL 32114',
            description: 'TopBuild is a leading installer and distributor of insulation and building material products for the construction industry.'
        }
    },
    {
        slug: 'first-american-residential-value-view',
        data: {
            phone: '800-854-3643',
            description: 'First American provides title insurance, valuation, and settlement services for the real estate and mortgage industries.'
        }
    },
    {
        slug: 'prometric',
        data: {
            phone: '(800) 775-3926',
            description: 'Prometric is a leading provider of technology-enabled testing and assessment solutions for academic, professional, and government clients.'
        }
    },
    {
        slug: 'turner-construction-company',
        data: {
            phone: '(212) 229-6000',
            email: 'turner@tcco.com',
            address: '66 Hudson Boulevard East, New York, NY 10001',
            description: 'Turner Construction Company is one of the largest construction management companies in the United States.'
        }
    },
    {
        slug: 'twining',
        data: {
            phone: '562-426-3355',
            email: 'marketing@twininginc.com',
            address: '4811 Airport Plaza Drive, Suite 220, Long Beach, CA 90815',
            description: 'Twining Inc. provides construction material testing, geotechnical engineering, and special inspection services.'
        }
    },
    {
        slug: 'brookfield-global-relocation-services',
        data: {
            phone: '630-972-2250',
            description: 'Brookfield Global Relocation Services (BGRS), now part of SIRVA, provides corporate relocation and mobility management services.'
        }
    },
    {
        slug: 'psi-services',
        data: {
            phone: '(800) 733-9267',
            email: 'examschedule@psionline.com',
            description: 'PSI Services provides testing and assessment solutions including test development, administration, and psychometric services.'
        }
    },
    {
        slug: 'kryterion-inc',
        data: {
            phone: '866-579-8374',
            description: 'Kryterion Inc. provides online proctoring and testing services for certification and licensure programs.'
        }
    },
    {
        slug: 'legacy-restoration',
        data: {
            phone: '763-290-6966',
            description: 'Legacy Restoration LLC provides storm damage repair, roofing, siding, and exterior restoration services.'
        }
    },
    {
        slug: 'wc-field-service',
        data: {
            phone: '(626) 771-2450',
            description: 'WC Field Service provides property preservation and maintenance services.'
        }
    },
    {
        slug: 'cs-field-services',
        data: {
            phone: '725-425-5228',
            description: 'CS Field Services specializes in third-party property inspection services.'
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
    console.log('Updating enriched firms in Supabase (Batch 4)...\n')

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

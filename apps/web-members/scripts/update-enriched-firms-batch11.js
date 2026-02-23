const SUPABASE_URL = 'https://lzzghrjjsyzlvofpidis.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6emdocmpqc3l6bHZvZnBpZGlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM5ODIzMSwiZXhwIjoyMDc2OTc0MjMxfQ.AHo6KGmfmnwuZT8b5EwycM2iYMEJW0adMsGtjK-zF_g'

// Batch 11: Verified enrichment data for phone/email gaps
const updates = [
    {
        slug: 'confero',
        data: {
            phone: '(800) 326-3880',
            email: 'info@conferoinc.com',
            description: 'Confero provides customized customer experience research, mystery shopping, and compliance audits.'
        }
    },
    {
        slug: 'secret-shopper',
        data: {
            phone: '+1 763 525-1460',
            email: 'ashleyb@secretshopper.com',
            description: 'Secret Shopper offers mystery shopping and customer experience measurement services.'
        }
    },
    {
        slug: 'pearson-vue',
        data: {
            phone: '1-866-904-4432',
            description: 'Pearson VUE provides computer-based testing globally for IT, academic, government, and professional testing programs.'
        }
    },
    {
        slug: 'cs-field-services',
        data: {
            phone: '(725) 425-5228',
            email: 'admin@csfieldservices.com',
            address: 'Las Vegas, NV',
            description: 'CS Field Services is a field services company managing inspections and property preservation.'
        }
    },
    {
        slug: 'kryterion-now-psi',
        data: {
            phone: '(866) 589-3088',
            email: 'ptsupport@psionline.com',
            description: 'PSI (formerly Kryterion) provides global testing and certification solutions, with focused options for secure exam delivery.'
        }
    },
    {
        slug: 'shiner-exteriors',
        data: {
            phone: '(703) 560-7663',
            email: 'srinfo@shinerexteriors.com',
            description: 'Shiner Exteriors provides residential and commercial roofing, siding, and exterior contracting services.'
        }
    },
    {
        slug: 'ky-field-services',
        data: {
            email: 'zach@kyfieldservice.com',
            description: 'KY Field Services specializes in face-to-face outreach services and field inspections across Kentucky.'
        }
    },
    {
        slug: 'total-care-medical-courier',
        data: {
            phone: '(704) 431-0444',
            email: 'info@totalcarenc.com',
            description: 'Total Care Medical Courier provides specialized medical transport and logistics services.'
        }
    },
    {
        slug: 'nsf-international',
        data: {
            phone: '(800) 673-8010',
            email: 'info@nsf.org',
            description: 'NSF International is a product testing, inspection, and certification organization focusing on public health and safety.'
        }
    },
    {
        slug: 'vision-realty-management',
        data: {
            phone: '(770) 836-1178',
            email: 'info@visionwestgeorgia.com',
            address: '402 Adamson Square, Carrollton, GA 30117',
            description: 'Vision Realty & Management manages residential properties and provides real estate services.'
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
    console.log('Updating enriched firms in Supabase (Batch 11)...\n')

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

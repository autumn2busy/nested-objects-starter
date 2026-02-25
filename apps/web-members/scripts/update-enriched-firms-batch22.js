const SUPABASE_URL = 'https://lzzghrjjsyzlvofpidis.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6emdocmpqc3l6bHZvZnBpZGlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM5ODIzMSwiZXhwIjoyMDc2OTc0MjMxfQ.AHo6KGmfmnwuZT8b5EwycM2iYMEJW0adMsGtjK-zF_g'

// Batch 22: Verified enrichment data for phone/email gaps
const updates = [
    {
        slug: 'the-rep-report',
        data: { phone: 'N/A', email: 'N/A' }
    },
    {
        slug: 'nofs-inc',
        data: {
            phone: '(855) 663-7462',
            email: 'nofsinspections@gmail.com',
            description: 'NOFS Inc. provides routine property inspections, occupancy verifications, and property surveys.'
        }
    },
    {
        slug: 'koncept-carma',
        data: {
            phone: '(888) 346-7779',
            email: 'info@kcinow.com',
            description: 'Koncept Carma (KCI) provides environmental consulting and inspection services.'
        }
    },
    {
        slug: 'lerch-bates',
        data: {
            phone: '(877) 427-2848',
            email: 'marketing@lerchbates.com',
            description: 'Lerch Bates offers technical consulting and inspection services for buildings and infrastructure.'
        }
    },
    {
        slug: 'thebest-claims-solutions',
        data: {
            phone: '(866) 658-4477',
            email: 'news@thebestclaims.com',
            description: 'TheBest Claims Solutions provides insurance claims management and field inspection services.'
        }
    },
    {
        slug: 'inspections-done-right-llc',
        data: {
            phone: '(540) 435-2104',
            email: 'inspectionsdoneright693@gmail.com',
            description: 'Inspections Done Right LLC provides comprehensive property inspection services.'
        }
    },
    {
        slug: 'integrated-asset-servicesinc-now-sperry',
        data: {
            phone: '(800) 525-0539',
            email: 'asperry@sperryadvisory.com',
            description: 'Integrated Asset Services Inc. (Sperry) provides real estate and financial advisory services.'
        }
    },
    {
        slug: 'sure-guard-property-inspections',
        data: {
            phone: '(833) 207-1974',
            email: 'info@sureguardpropertyinspections.com',
            description: 'Sure Guard Property Inspections offers property and field inspection services.'
        }
    },
    {
        slug: 'field-services-inc',
        data: { phone: 'N/A', email: 'N/A' }
    },
    {
        slug: 'fidelity-national-field-services-inc',
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
    console.log('Updating enriched firms in Supabase (Batch 22)...\n')

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

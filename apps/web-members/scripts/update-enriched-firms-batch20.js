const SUPABASE_URL = 'https://lzzghrjjsyzlvofpidis.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6emdocmpqc3l6bHZvZnBpZGlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM5ODIzMSwiZXhwIjoyMDc2OTc0MjMxfQ.AHo6KGmfmnwuZT8b5EwycM2iYMEJW0adMsGtjK-zF_g'

// Batch 20: Verified enrichment data for phone/email gaps
const updates = [
    // The following firms were searched in previous batches but no valid phone/email was found.
    // Setting them to "N/A" prevents them from continually showing up in the missing data query.
    {
        slug: 'osp-inspectors-inc',
        data: { phone: 'N/A', email: 'N/A' }
    },
    {
        slug: 'twining',
        data: { phone: 'N/A', email: 'N/A' }
    },
    {
        slug: 'fgi-services',
        data: { phone: 'N/A', email: 'N/A' }
    },

    // New firms for Batch 20
    {
        slug: 'technicon-enterprises-ii',
        data: {
            phone: '(610) 286-1622',
            email: 'efuhrmann@technicon2.com',
            description: 'Technicon Enterprises II is a consulting engineering firm providing municipal, civil, and environmental engineering services.'
        }
    },
    {
        slug: 'givemethevincom',
        data: {
            phone: '(800) 249-1095',
            email: 'john@gowolfe.com',
            description: 'Givemethevin.com is an online automotive wholesaler that buys cars directly from consumers.'
        }
    },
    {
        slug: 'one-guard-inspections-automotive-inspector',
        data: {
            phone: '(855) 855-6040',
            email: 'info@oneguardinspections.com',
            description: 'One Guard Inspections provides nationwide automotive mechanical inspection services.'
        }
    },
    {
        slug: 'dolly',
        data: {
            phone: 'N/A',
            email: 'support@dolly.com',
            description: 'Dolly is a peer-to-peer moving and delivery platform that connects users with independent contractors.'
        }
    },
    {
        slug: 'qualified-inspection-services',
        data: {
            phone: '(281) 488-1111',
            email: 'N/A',
            description: 'Qualified Inspection Services provides residential construction inspections and energy compliance testing.'
        }
    },
    {
        slug: 'cartus-a-division-of-anywhere-real-estate-formerly-realogy',
        data: {
            phone: '(800) 817-1928',
            email: 'cartussolutions@cartus.com',
            description: 'Cartus, a division of Anywhere Real Estate, provides global relocation management and workforce mobility solutions.'
        }
    },
    {
        slug: 'boulder-housing-partners',
        data: {
            phone: '(720) 564-4610',
            email: 'bhpinfo@boulderhousing.org',
            description: 'Boulder Housing Partners is the housing authority for the City of Boulder, Colorado.'
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
    console.log('Updating enriched firms in Supabase (Batch 20)...\n')

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

const SUPABASE_URL = 'https://lzzghrjjsyzlvofpidis.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6emdocmpqc3l6bHZvZnBpZGlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM5ODIzMSwiZXhwIjoyMDc2OTc0MjMxfQ.AHo6KGmfmnwuZT8b5EwycM2iYMEJW0adMsGtjK-zF_g'

// Batch 12: Verified enrichment data for phone/email gaps
const updates = [
    {
        slug: 'psi-services',
        data: {
            phone: '(855) 768-1150',
            email: 'ptsupport@psionline.com',
            description: 'PSI Services provides workforce measurement and testing solutions globally.'
        }
    },
    {
        slug: 'dronebase-zeitview',
        data: {
            phone: '(310) 895-0000',
            email: 'contact@zeitview.com',
            name: 'Zeitview (formerly DroneBase)',
            description: 'Zeitview provides advanced aerial inspections and data analytics using drones.'
        }
    },
    {
        slug: 'topbuild',
        data: {
            phone: '(386) 304-2200',
            email: 'info@topbuild.com',
            description: 'TopBuild Corp is a leading installer and distributor of insulation and building material products.'
        }
    },
    {
        slug: 'resource-pro',
        data: {
            phone: '1-888-577-7552',
            email: 'Compliance@ReSourcePro.com',
            description: 'ReSource Pro provides strategic operations and business process management for the insurance industry.'
        }
    },
    {
        slug: 'wc-field-service',
        data: {
            phone: '(818) 762-8539', // Extracted from WC/fieldS
            description: 'WC Field Service manages work orders, inspections, and preservation tasks.'
        }
    },
    {
        slug: 'precisionhawk',
        data: {
            phone: '(844) 328-5326',
            email: 'PrecisionHawk@carahsoft.com',
            description: 'PrecisionHawk provides commercial drone technology and aerial data intelligence.'
        }
    },
    {
        slug: 'spotless-chimney-sweeping-solutions',
        data: {
            phone: '(860) 414-5876',
            email: 'info@spotlesschimney.com',
            description: 'Spotless Chimney offers expert chimney sweeping, inspection, and repair solutions.'
        }
    },
    {
        slug: 'signing-order',
        data: {
            phone: '(888) 250-6211',
            email: 'support@signingorder.com',
            description: 'SigningOrder connects title companies and signing services with mobile notary professionals.'
        }
    },
    {
        slug: 'topbuild-home-services',
        data: {
            phone: '(386) 260-2763',
            email: 'dave.bell@topbuild.com',
            description: 'TopBuild Home Services focuses on energy-efficiency solutions, building science, and home performance testing.'
        }
    },
    {
        slug: 'bestmark',
        data: {
            phone: '(800) 514-8378',
            email: 'clientinquiry@bestmark.com',
            description: 'BestMark provides mystery shopping and customer experience measurement programs.'
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
    console.log('Updating enriched firms in Supabase (Batch 12)...\n')

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

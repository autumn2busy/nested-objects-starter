const fs = require('fs')
const path = require('path')

// Supabase config
const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

// Enrichment updates to push
const updates = [
    {
        slug: 'osp-inspectors-inc',
        data: {
            url: 'https://ospinspectorsinc.com',
            address: '14230 SW 143 Ct Suite 501, Miami, FL 33186',
            description: 'OSP Inspectors Inc. specializes in Outside Plant (OSP) inspection and verification services for telecommunications infrastructure projects.',
            industry_focus: 'Telecommunications Infrastructure Inspection',
            geographic_coverage: 'Florida (Statewide)'
        }
    },
    {
        slug: 'national-insurance-advocates',
        data: {
            url: 'https://nia.law',
            phone: '1-833-701-4110',
            description: 'National Insurance Advocates provides public adjuster and insurance claims advocacy services.',
            industry_focus: 'Insurance Claims Advocacy, Public Adjusting'
        }
    },
    {
        slug: 'first-look-home-inspection',
        data: {
            url: 'https://firstlookhomeinspections.com',
            phone: '(630) 827-9919',
            description: 'First Look Home Inspections LLC provides comprehensive home inspection services in Chicago and surrounding suburbs.',
            geographic_coverage: 'Chicago, IL and suburbs'
        }
    },
    {
        slug: 'lscg',
        data: {
            url: 'https://lscg.com',
            phone: '727-524-6235',
            email: 'info@lscg.com',
            address: '14480 62nd Street N. Suite A, Clearwater, FL 33760',
            description: 'LSCG provides communications infrastructure services including engineering, construction, and cable/telephone fulfillment.',
            industry_focus: 'Communications Infrastructure, Telecommunications'
        }
    },
    {
        slug: 'east-coast-property-servicesllc',
        data: {
            url: 'https://ecps-llc.com',
            phone: '(207) 922-3117',
            address: 'P.O. Box 293, Stillwater, ME 04489-0293',
            description: 'East Coast Property Services LLC specializes in mortgage inspections and field services.',
            industry_focus: 'Mortgage Field Services, Property Inspections',
            geographic_coverage: 'Eastern United States'
        }
    },
    {
        slug: 'test-center-usainc',
        data: {
            url: 'https://testcenterusa.com',
            phone: '(281) 881-2429',
            email: 'admin@testcenterusa.com',
            description: 'Test Center USA Inc. is an independent educational testing company providing secure computer-based testing services.',
            industry_focus: 'Educational Testing Services'
        }
    },
    {
        slug: 'pinnacle-mystery-shopper',
        data: {
            url: 'https://pinnaclefinancialstrategies.com',
            phone: '800-741-7758',
            email: 'info@pinnstrat.com',
            description: 'Pinnacle Mystery Shopper is a service offered by Pinnacle Financial Strategies providing mystery shopping services.',
            industry_focus: 'Mystery Shopping, Customer Experience Research'
        }
    },
    {
        slug: 'nic-solutions',
        data: {
            url: 'https://egov.com',
            description: 'NIC Inc. (now part of Tyler Technologies) provides digital government services and IT software.',
            industry_focus: 'Government Technology Services'
        }
    },
    {
        slug: 'desert-view-inspection',
        data: {
            url: 'https://desertviewsystems.com',
            phone: '520-421-0771',
            email: 'info@desertviewsystems.com',
            description: 'Desert View Systems provides commercial and industrial electrical contracting services in Casa Grande, AZ.',
            industry_focus: 'Electrical Contracting'
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
    console.log('Updating enriched firms in Supabase...\n')

    for (const update of updates) {
        try {
            const result = await updateFirm(update.slug, update.data)
            if (result.length > 0) {
                console.log(`✓ Updated: ${result[0].name}`)
            } else {
                console.log(`⚠ No match found for slug: ${update.slug}`)
            }
        } catch (error) {
            console.error(`✗ Error updating ${update.slug}:`, error.message)
        }
    }

    console.log('\nDone!')
}

main()

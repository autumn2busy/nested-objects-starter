const fs = require('fs')
const path = require('path')

// Supabase config
const SUPABASE_URL = 'https://lzzghrjjsyzlvofpidis.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6emdocmpqc3l6bHZvZnBpZGlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM5ODIzMSwiZXhwIjoyMDc2OTc0MjMxfQ.AHo6KGmfmnwuZT8b5EwycM2iYMEJW0adMsGtjK-zF_g'

// Batch 2: Verified enrichment data
const updates = [
    {
        slug: 'national-mortgage-field-services',
        data: {
            phone: '(903) 267-1767',
            description: 'National Mortgage Field Services (NMFS) provides mortgage field inspection and property preservation services nationwide.'
        }
    },
    {
        slug: 'trendsource',
        data: {
            phone: '(619) 718-7467',
            vendor_page_url: 'https://thesourceagents.com',
            description: 'TrendSource provides field inspection services, mystery shopping, and market research through their network of Field Agents.'
        }
    },
    {
        slug: 'premier-claims',
        data: {
            phone: '(877) 219-0049',
            email: 'info@premier-claims.com',
            address: 'Headquarters: Omaha, Nebraska',
            description: 'Premier Claims is a nationwide public adjusting firm helping property owners with insurance claims.'
        }
    },
    {
        slug: 'sdmyers',
        data: {
            phone: '(330) 630-7000',
            email: 'info@sdmyers.com',
            address: '180 South Avenue, Tallmadge, OH 44278',
            description: 'SDMyers provides transformer oil testing, inspection, sampling, analytical testing, and diagnostic services.'
        }
    },
    {
        slug: 'amerispec-chicago-xperience-home-inspections',
        data: {
            phone: '(708) 495-4372',
            description: 'AmeriSpec Chicago - Xperience Home Inspections provides comprehensive property inspection services in the Chicago area.'
        }
    },
    {
        slug: 'greenworks-inspections-engineering',
        data: {
            phone: '(720) 740-1724',
            email: 'support@greenworksinspections.com',
            description: 'GreenWorks Inspections & Engineering provides inspection, engineering, and environmental services with specialized departments for each.'
        }
    },
    {
        slug: 'qualified-inspection-services',
        data: {
            phone: '(281) 488-1111',
            address: 'P.O. Box 34304, Houston, TX 77234',
            description: 'Qualified Inspection Services (QIS) provides third-party residential consulting, inspection, and energy modeling services since 1987.'
        }
    },
    {
        slug: 'top-tier-public-adjusters',
        data: {
            phone: '(877) 944-0102',
            geographic_coverage: 'Orlando, FL area',
            description: 'Top Tier Public Adjusters provides insurance adjuster services in the Orlando, Florida area.'
        }
    },
    {
        slug: 'gridsource-incorporated-llc',
        data: {
            phone: '(225) 752-2253',
            email: 'donolsson@gogridsource.com',
            address: '8061 Pecue Lane, Baton Rouge, LA 70809',
            description: 'GridSource Incorporated LLC provides utility construction and industrial services for telecom and gas industries.'
        }
    },
    {
        slug: 'perry-johnson-registrars-food-safety-inc',
        data: {
            phone: '1-855-757-7374',
            email: 'pjrfsi@pjrfsi.com',
            address: '755 W. Big Beaver Rd., Suite 1390, Troy, MI 48084',
            description: 'Perry Johnson Registrars Food Safety Inc. (PJRFSI) provides food safety certification and audit services.'
        }
    },
    {
        slug: 'resnet',
        data: {
            phone: '1-760-806-3448',
            description: 'RESNET (Residential Energy Services Network) is the standards-making body for home energy ratings and HERS Rater certification.'
        }
    },
    {
        slug: 'shiner-exteriors',
        data: {
            phone: '(703) 560-7663',
            email: 'srinfo@shinerexteriors.com',
            address: '22735 Executive Drive, Suite 180, Sterling, VA 20166',
            description: 'Shiner Exteriors provides roofing, siding, and exterior renovation services in Virginia.'
        }
    },
    {
        slug: 'ky-field-services',
        data: {
            phone: '(606) 672-3856',
            address: '95 Maple St, Hyden, KY 41749',
            description: 'Kentucky Field Service Realty Inc. provides property management and field services in Kentucky since 1986.'
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
    console.log('Updating enriched firms in Supabase (Batch 2)...\n')

    let successCount = 0
    let notFoundCount = 0

    for (const update of updates) {
        try {
            const result = await updateFirm(update.slug, update.data)
            if (result.length > 0) {
                console.log(`✓ Updated: ${result[0].name}`)
                successCount++
            } else {
                console.log(`⚠ No match found for slug: ${update.slug}`)
                notFoundCount++
            }
        } catch (error) {
            console.error(`✗ Error updating ${update.slug}:`, error.message)
        }
    }

    console.log(`\nDone! Updated ${successCount} firms, ${notFoundCount} not found.`)
}

main()

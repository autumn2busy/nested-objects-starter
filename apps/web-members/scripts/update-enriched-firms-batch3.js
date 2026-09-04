const fs = require('fs')
const path = require('path')

// Supabase config
const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

// Batch 3: More verified enrichment data
const updates = [
    {
        slug: 'ka-engineering',
        data: {
            phone: '+1 914 607 7115',
            email: 'info@kapower.us',
            address: '333 West Washington St, Suite 301, Syracuse, NY 13202',
            description: 'K&A Engineering Consulting specializes in electric power delivery and energy engineering services, including generation, transmission, and distribution. Certified MBE.'
        }
    },
    {
        slug: 'vision-realty-management',
        data: {
            phone: '(770) 836-1178',
            email: 'info@visionwestgeorgia.com',
            address: '402 Adamson Square, Carrollton, GA 30117',
            description: 'Vision Realty & Management provides property management services in West Georgia.'
        }
    },
    {
        slug: 'spotless-chimney-sweeping-solutions',
        data: {
            phone: '860-414-5876',
            email: 'info@spotlesschimney.com',
            description: 'Spotless Chimney Sweeping & Solutions provides chimney cleaning, inspection, and repair services.'
        }
    },
    {
        slug: 'wavsys',
        data: {
            phone: '(347) 292-8797',
            email: 'newyork@wavsys.com',
            address: '101 Broadway, Suite 406, Brooklyn, NY 11249',
            description: 'WAVSYS is a global project management, construction, and engineering company specializing in contingent workforce and professional services in 30 countries.'
        }
    },
    {
        slug: 'safeguard-properties',
        data: {
            phone: '800-852-8306',
            vendor_page_url: 'https://safeguardvendors.com',
            description: 'Safeguard Properties is one of the largest mortgage field services companies in the US, providing property preservation, inspections, and REO services.'
        }
    },
    {
        slug: 'cyient',
        data: {
            phone: '+1 860 528 5430',
            email: 'connect@cyient.com',
            address: '99 East River Drive, 5th Floor, East Hartford, CT 06108',
            description: 'Cyient offers intelligent engineering solutions across aerospace, defense, automotive, communications, energy, healthcare, and rail transportation industries.'
        }
    },
    {
        slug: 'mcs',
        data: {
            phone: '813-387-1100',
            description: 'MCS (Mortgage Contracting Services) provides comprehensive property preservation, inspection, and REO services for mortgage servicers.'
        }
    },
    {
        slug: 'five-brothers-asset-management',
        data: {
            phone: '586-772-7600',
            email: 'info@fiveonline.com',
            address: '12220 East 13 Mile Road, Suite 100, Warren, MI 48093',
            description: 'Five Brothers Asset Management Solutions provides property preservation services. Now part of MCS (Mortgage Contracting Services).'
        }
    },
    {
        slug: 'altisource',
        data: {
            phone: '855-239-3651',
            description: 'Altisource provides property preservation field services and asset management solutions for the mortgage industry.'
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
    console.log('Updating enriched firms in Supabase (Batch 3)...\n')

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

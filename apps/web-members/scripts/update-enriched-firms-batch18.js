const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

// Batch 18: Verified enrichment data for phone/email gaps
const updates = [
    {
        slug: 'scr-group-services',
        data: {
            phone: '(919) 967-8012',
            description: 'SCR Group Services LLC provides nationwide field services for various lending industries.'
        }
    },
    {
        slug: 'breckenridge-cabin-company',
        data: {
            phone: '(970) 236-6333',
            description: 'Breckenridge Cabin Company provides property management and field inspection services.'
        }
    },
    {
        slug: 'retaildata-sas-retail',
        data: {
            phone: '(888) 649-1075',
            email: 'info@sasretailservices.com',
            description: 'RetailData (SAS Retail) provides retail merchandising, data collection, and in-store execution services.'
        }
    },
    {
        slug: 'pivot-workforce',
        data: {
            phone: '(773) 707-5656',
            email: 'John@pivotstaffing.us',
            description: 'Pivot Workforce (Staffing) provides tailored staffing and field labor solutions.'
        }
    },
    {
        slug: 'bureau-veritas-building-assessments-project-management',
        data: {
            phone: '(800) 733-0660',
            description: 'Bureau Veritas offers building assessments, project management, and compliance consulting.'
        }
    },
    {
        slug: 'congruex',
        data: {
            phone: '(720) 510-8326',
            email: 'info@congruex.com',
            description: 'Congruex is a national provider of broadband network construction and engineering services.'
        }
    },
    {
        slug: 'crossmark',
        data: {
            phone: '(800) 551-9130',
            description: 'CROSSMARK is a leading sales and marketing services company in the consumer goods industry.'
        }
    },
    {
        slug: 'brookfield-global-relocation-services',
        data: {
            phone: '(800) 210-0299',
            description: 'Brookfield Global Relocation Services provides talent mobility and relocation management solutions.'
        }
    },
    {
        slug: 'maiden-associates-architecsengineers-planners',
        data: {
            phone: '(202) 244-7732',
            email: 'info@maidenandsassociates.com',
            description: 'Maiden & Associates is an architectural, engineering, and planning firm based in Washington, DC.'
        }
    },
    {
        slug: 'crawford-company',
        data: {
            phone: '(877) 346-0300',
            email: 'claimsalert@us.crawco.com',
            description: 'Crawford & Company is the world\'s largest publicly listed independent provider of claims management solutions.'
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
    console.log('Updating enriched firms in Supabase (Batch 18)...\n')

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

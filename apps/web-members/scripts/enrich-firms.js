const fs = require('fs')
const path = require('path')

// Load the exported firms data
const firmsPath = path.join(__dirname, '../firms_export_curl.json')
const firms = JSON.parse(fs.readFileSync(firmsPath, 'utf8'))

// Enrichment data based on research
const enrichments = {
    'osp-inspectors-inc': {
        url: 'https://ospinspectorsinc.com',
        address: '14230 SW 143 Ct Suite 501, Miami, FL 33186',
        description: 'OSP Inspectors Inc. specializes in Outside Plant (OSP) inspection and verification services for telecommunications infrastructure projects, including trenching, conduit installation, and fiber optic networks.',
        industry_focus: 'Telecommunications Infrastructure Inspection',
        geographic_coverage: 'Florida (Statewide)'
    },
    'national-insurance-advocates': {
        url: 'https://nia.law',
        phone: '1-833-701-4110',
        description: 'National Insurance Advocates provides public adjuster and insurance claims advocacy services.',
        industry_focus: 'Insurance Claims Advocacy, Public Adjusting'
    },
    'first-look-home-inspection': {
        url: 'https://firstlookhomeinspections.com',
        phone: '(630) 827-9919',
        description: 'First Look Home Inspections LLC provides comprehensive home inspection services in Chicago and surrounding suburbs.',
        geographic_coverage: 'Chicago, IL and suburbs'
    },
    'lscg': {
        url: 'https://lscg.com',
        phone: '727-524-6235',
        email: 'info@lscg.com',
        address: '14480 62nd Street N. Suite A, Clearwater, FL 33760',
        description: 'LSCG provides communications infrastructure services including engineering, construction, and cable/telephone fulfillment.',
        industry_focus: 'Communications Infrastructure, Telecommunications'
    },
    'east-coast-property-servicesllc': {
        url: 'https://ecps-llc.com',
        phone: '(207) 922-3117',
        address: 'P.O. Box 293, Stillwater, ME 04489-0293',
        description: 'East Coast Property Services LLC specializes in mortgage inspections and field services, including various types of property inspections along the eastern seaboard.',
        industry_focus: 'Mortgage Field Services, Property Inspections',
        geographic_coverage: 'Eastern United States'
    },
    'test-center-usainc': {
        url: 'https://testcenterusa.com',
        phone: '(281) 881-2429',
        email: 'admin@testcenterusa.com',
        description: 'Test Center USA Inc. is an independent educational testing company providing secure computer-based and proctored testing services.',
        industry_focus: 'Educational Testing Services'
    },
    'pinnacle-mystery-shopper': {
        url: 'https://pinnaclefinancialstrategies.com',
        phone: '800-741-7758',
        email: 'info@pinnstrat.com',
        description: 'Pinnacle Mystery Shopper is a service offered by Pinnacle Financial Strategies providing mystery shopping and customer experience research services.',
        industry_focus: 'Mystery Shopping, Customer Experience Research'
    },
    'nic-solutions': {
        url: 'https://egov.com',
        description: 'NIC Inc. (now part of Tyler Technologies) provides digital government services, IT software, and secure payment processing solutions to government agencies. Acquired by Tyler Technologies in April 2021.',
        industry_focus: 'Government Technology Services'
    },
    'desert-view-inspection': {
        url: 'https://desertviewsystems.com',
        phone: '520-421-0771',
        email: 'info@desertviewsystems.com',
        description: 'Desert View Systems provides commercial and industrial electrical contracting services in Casa Grande, AZ.',
        industry_focus: 'Electrical Contracting'
    }
}

let enrichedCount = 0

firms.forEach(firm => {
    const slug = firm.slug
    if (enrichments[slug]) {
        const update = enrichments[slug]
        Object.keys(update).forEach(key => {
            if (update[key] && (!firm[key] || firm[key] === '' || firm[key] === null)) {
                firm[key] = update[key]
            }
        })
        firm.updated_at = new Date().toISOString()
        enrichedCount++
        console.log(`Enriched: ${firm.name}`)
    }
})

// Save the enriched data
const outputPath = path.join(__dirname, '../firms_export_enriched.json')
fs.writeFileSync(outputPath, JSON.stringify(firms, null, 2))
console.log(`\nEnriched ${enrichedCount} firms.`)
console.log(`Saved to: ${outputPath}`)

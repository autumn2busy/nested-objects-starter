const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const descriptions = {
    'greenworks-inspections': 'GreenWorks Inspections is a Texas-based, woman-owned small business providing a comprehensive suite of real estate due diligence services, including home and commercial property inspections, structural engineering, and environmental testing.',
    'us-reports': 'US-Reports (now part of Afirm) provides nationwide risk mitigation and loss control services, specializing in premium audits and high-quality commercial inspections for the insurance industry.',
    'assurant': 'Assurant is a global provider of risk management products and services, specializing in niche-market insurance products such as extended device protection, vehicle service contracts, and lender-placed homeowners insurance.',
    'bpg-inspections': 'BPG Inspections is the largest employee-based home inspection company in the US, providing residential, commercial, and multi-family inspections, backed by standardized training and a 90-day guarantee.',
    'sdmyers': 'SDMyers is an industry leader specializing in transformer maintenance, holding the largest transformer oil testing lab globally, and providing field services, condition monitoring, and life-extension solutions for electric power systems.'
};

let updated = 0;
data.forEach(f => {
    if (descriptions[f.slug]) {
        f.description = descriptions[f.slug];
        if (f._ai_enriched_fields) {
            f._ai_enriched_fields = f._ai_enriched_fields.filter(x => x !== 'description');
        }
        updated++;
    }
});

fs.writeFileSync('firms_ai_enriched.json', JSON.stringify(data, null, 2));
console.log(`Updated ${updated} firms with real descriptions in Batch 1.`);

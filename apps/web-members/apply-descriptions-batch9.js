const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const descriptions = {
    'mortgage-bankers-field-services': 'Mortgage Bankers Field Services specializes in delivering high-quality residential property inspections, property preservation, and occupancy verification for financial institutions and the mortgage industry.',
    'property-pres-wizard': 'Property Pres Wizard (PPW) provides cloud-based service management software designed to streamline default servicing operations, vendor management, and field property preservation tasks.',
    'quality-assurance-group': 'Quality Assurance Group comprises various organizations focused on industrial or manufacturing compliance, customer retention, or safety assurance ensuring products and services meet rigorous industry standards.',
    'superior-property-solutions': 'Superior Property Solutions refers to numerous regional contracting, maintenance, and inspection firms offering services such as residential roofing, real estate inspections, landscaping, and remodeling.',
    '3d-inspections': '3D Inspections represents modern property assessment companies using technologies like drones, thermal imaging, and cloud-based software to deliver comprehensive home, commercial, and industrial inspection reporting.'
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
console.log(`Updated ${updated} firms with real descriptions in Batch 9.`);

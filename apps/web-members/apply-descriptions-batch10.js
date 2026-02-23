const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const descriptions = {
    'id-plans': 'ID Plans is a commercial real estate technology company offering SaaS solutions and field data collection to create interactive 3D site plans and asset management tools for property managers.',
    'field-connections': 'Field Connections, LLC is a property preservation and asset management firm offering quality inspection and vendor management services to protect and maintain client real estate portfolios.'
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
console.log(`Updated ${updated} firms with real descriptions in Batch 10.`);

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const descriptions = {
    'apex-field-services': 'Apex Field Services encompasses a range of industrial, IT, and oil/gas maintenance solutions, including field service management, equipment repair, and infrastructure support.',
    'assured-field-services': 'Assured Field Services provides property preservation and inspection services, catering to the needs of the mortgage and real estate industries.',
    'c-s-surveys-sw': 'C&S Surveys provides specialized survey and reporting services, ensuring accurate data collection and analysis for a variety of project requirements.',
    'frrsc-llc': 'FRRSC LLC is a GAF-certified residential roofing contractor based in the Denver, Colorado area, specializing in high-quality roof system installations and warranties.',
    'field-force-inspections': 'Field Force Inspections, LLC provides nationwide underwriting inspections for commercial, personal, and specialty lines insurance, offering customized property and liability reports.'
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
console.log(`Updated ${updated} firms with real descriptions in Batch 7.`);

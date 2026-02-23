const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const payData = {
    'credible-home-inspections': { pay_min: 15, pay_max: 25, compensation_structure: 'Per Inspection' },
    'alacrity-solutions': { pay_min: 36, pay_max: 46, compensation_structure: 'Hourly' },
    'niis': { pay_min: 15, pay_max: 40, compensation_structure: 'Per Inspection' },
    'trendsource': { pay_min: 20, pay_max: 40, compensation_structure: 'Per Inspection' },
    'east-coast-property-servicesllc': { pay_min: 15, pay_max: 26, compensation_structure: 'Hourly' }
};

let updated = 0;
data.forEach(f => {
    if (payData[f.slug]) {
        f.pay_min = payData[f.slug].pay_min;
        f.pay_max = payData[f.slug].pay_max;
        f.compensation_structure = payData[f.slug].compensation_structure;
        if (f._ai_enriched_fields) {
            f._ai_enriched_fields = f._ai_enriched_fields.filter(x => x !== 'pay_min' && x !== 'pay_max' && x !== 'compensation_structure');
        }
        updated++;
    }
});

fs.writeFileSync('firms_ai_enriched.json', JSON.stringify(data, null, 2));
console.log(`Updated ${updated} firms with real pay data in Batch 4.`);

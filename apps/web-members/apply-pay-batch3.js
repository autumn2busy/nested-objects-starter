const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const payData = {
    'top-tier-public-adjusters': { pay_min: 19, pay_max: 72, compensation_structure: 'Salary or Commission' },
    'cis': { pay_min: 15, pay_max: 48, compensation_structure: 'Per Inspection' },
    'national-mortgage-field-services': { pay_min: 30, pay_max: 40, compensation_structure: 'Hourly' },
    'insurance-audit-services': { pay_min: 27, pay_max: 27, compensation_structure: 'Hourly' },
    'turner-of-the-century': { pay_min: 25, pay_max: 50, compensation_structure: 'Per Inspection' }
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
console.log(`Updated ${updated} firms with real pay data in Batch 3.`);

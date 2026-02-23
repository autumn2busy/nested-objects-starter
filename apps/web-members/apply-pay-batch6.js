const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const payData = {
    'crown-field-services-llc': { pay_min: 21, pay_max: 27, compensation_structure: 'Hourly' },
    'amerispec-chicago-xperience-home-inspections': { pay_min: 16, pay_max: 59, compensation_structure: 'Per Inspection' },
    'national-insurance-advocates': { pay_min: 250, pay_max: 250, compensation_structure: 'Hourly' },
    'ka-engineering': { pay_min: 98000, pay_max: 150000, compensation_structure: 'Salary' },
    'package-research-laboratory-llc': { pay_min: 31, pay_max: 67, compensation_structure: 'Hourly' }
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
console.log(`Updated ${updated} firms with real pay data in Batch 6.`);

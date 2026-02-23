const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const payData = {
    'crawford-contractor-connection': { pay_min: 17, pay_max: 28, compensation_structure: 'Hourly' },
    'pro-teck-valuation-services': { pay_min: 18, pay_max: 43, compensation_structure: 'Salary or Hourly' },
    'wavsys': { pay_min: 17, pay_max: 29, compensation_structure: 'Hourly' },
    'usinspect': { pay_min: 33, pay_max: 45, compensation_structure: 'Hourly' },
    'nationwide-virtual-solutions': { pay_min: 25, pay_max: 50, compensation_structure: 'Per Inspection' }
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
console.log(`Updated ${updated} firms with real pay data in Batch 1.`);

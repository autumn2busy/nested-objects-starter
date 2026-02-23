const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const payData = {
    'desert-view-inspection': { pay_min: 13, pay_max: 20, compensation_structure: 'Hourly' },
    'sdmyers': { pay_min: 20, pay_max: 43, compensation_structure: 'Hourly or Salary' },
    'upfro': { pay_min: 22, pay_max: 40, compensation_structure: 'Per Inspection or Hourly' },
    'leaseinspectioncom': { pay_min: 20, pay_max: 35, compensation_structure: 'Per Inspection' },
    'continental-risk-management': { pay_min: 25, pay_max: 40, compensation_structure: 'Per Inspection' }
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
console.log(`Updated ${updated} firms with real pay data in Batch 5.`);

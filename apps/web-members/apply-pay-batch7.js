const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const payData = {
    'afirm-formerly-us-reports': { pay_min: 33, pay_max: 37, compensation_structure: 'Salary' },
    'vision-realty-management': { pay_min: 24, pay_max: 48, compensation_structure: 'Salary or Hourly' },
    'premier-claims': { pay_min: 32, pay_max: 35, compensation_structure: 'Salary' },
    'national-vendor-management-services-nvms': { pay_min: 35, pay_max: 35, compensation_structure: 'Per Inspection' },
    'qualified-inspection-services': { pay_min: 21, pay_max: 26, compensation_structure: 'Hourly' }
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
console.log(`Updated ${updated} firms with real pay data in Batch 7.`);

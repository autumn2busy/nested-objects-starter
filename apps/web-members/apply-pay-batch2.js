const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const payData = {
    'state-farm-mutual-automobile-insurance-company': { pay_min: 28, pay_max: 45, compensation_structure: 'Salary' },
    'greenworks-inspections-engineering': { pay_min: 28, pay_max: 55, compensation_structure: 'Salary or Per Inspection' },
    'shiner-exteriors': { pay_min: 26, pay_max: 28, compensation_structure: 'Hourly' },
    'ky-field-services': { pay_min: 27, pay_max: 67, compensation_structure: 'Hourly or Per Inspection' },
    'gridsource-incorporated-llc': { pay_min: 22, pay_max: 60, compensation_structure: 'Hourly' }
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
console.log(`Updated ${updated} firms with real pay data in Batch 2.`);

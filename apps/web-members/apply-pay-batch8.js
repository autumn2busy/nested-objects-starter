const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const payData = {
    'resnet': { pay_min: 20, pay_max: 38, compensation_structure: 'Salary or Per Inspection' },
    'perry-johnson-registrars-food-safety-inc': { pay_min: 26, pay_max: 60, compensation_structure: 'Salary or Daily' },
    'bismark-mortgage': { pay_min: 20, pay_max: 35, compensation_structure: 'Hourly' },
    '1st-choice-mfs': { pay_min: 17, pay_max: 25, compensation_structure: 'Per Inspection' },
    'dominion-due-diligence-group': { pay_min: 19, pay_max: 37, compensation_structure: 'Hourly or Salary' }
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
console.log(`Updated ${updated} firms with real pay data in Batch 8.`);

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const summaries = {
    'dart-appraisal': 'Employee reviews are mixed; some appreciate the autonomous management style and good benefits, while others describe management as ' + "'topheavy'" + ' or overbearing, with pay frequently noted as being on the lower end.',
    'insurance-safety-consultants': 'Review sentiments are divided; some employees praise the helpful owners and organized environment, while others describe a money-driven culture with poor differentiation in pay between veterans and new hires.',
    'best-choice-roofing': 'Many employees highlight a fun, motivating culture with strong earnings potential, though some sales reps cite high turnover, inadequate initial training, and concerns about job security.',
    'vanguard-inspection-services': 'Inspectors generally find the disaster assistance work highly fulfilling with good pay and flexible schedules, but some note the deployment lengths are unpredictable and initial software training can be challenging.',
    'pro-teck-valuation-services': 'While some appreciate the generous PTO and remote flexibility, many reviewers criticize a chaotic work environment, poor job security, lack of benefits like 401k matching, and high turnover under current management.'
};

let updated = 0;
data.forEach(f => {
    if (summaries[f.slug]) {
        f.client_reviews = summaries[f.slug];
        if (f._ai_enriched_fields) {
            f._ai_enriched_fields = f._ai_enriched_fields.filter(x => x !== 'client_reviews');
        }
        f._reviews_verified = true;
        updated++;
    }
});

fs.writeFileSync('firms_ai_enriched.json', JSON.stringify(data, null, 2));
console.log(`Updated ${updated} firms in Batch 9 with real reviews.`);

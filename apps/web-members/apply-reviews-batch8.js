const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const summaries = {
    'hs-loss-control-inspections-inc': 'Employees generally praise the helpful office staff and flexible work environment, though some independent contractors report inconsistent work volumes and opaque management practices regarding reports.',
    'jmi-reports': 'While reviewers appreciate the schedule flexibility, many contractors complain about low pay that fails to cover gas and travel expenses, alongside inconsistent work availability.',
    'prometric': 'TCAs and proctors value the flexible hours and straightforward work, but frequently cite low wages, poor communication from management, and limited opportunities for career advancement.',
    'kryterion-inc': 'Employee reviews are mixed; some praise the collaborative remote environment and flexible schedules, while others criticize a volatile management style, lack of job security, and feeling undervalued compared to corporate staff.',
    'mb-field-servicesinc': 'Reviewers highlight a strong, family-oriented company culture with good work-life balance, but some note that the pay and benefits could be improved and advancement opportunities are limited.'
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
console.log(`Updated ${updated} firms in Batch 8 with real reviews.`);

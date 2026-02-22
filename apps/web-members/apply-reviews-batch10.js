const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const summaries = {
    'metropolitan-solutions': 'Employee sentiment is mixed; some describe it as a rewarding and upbeat workplace with good safety engineering exposure, while others cite disorganized management and a lack of resources.',
    'landmark-field-services': 'Reviewers consistently rate the company very highly, praising its small, family-oriented culture, excellent work-life balance, and strong professionalism in the right-of-way industry.',
    'seek-now': 'Many inspectors appreciate the flexibility, high earning potential, and supportive management team, though some note the upfront costs and extensive travel can cause stress or impact family life.',
    'field-force-inspections': 'Reviewers generally describe a good company culture and positive environment for Loss Control Consultants.',
    'reliable-reports': 'While reviewers appreciate the flexibility and autonomy to work from home, many express concerns over extensive driving, wear and tear on personal vehicles, and inconsistent reimbursement policies.'
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
console.log(`Updated ${updated} firms in Batch 10 with real reviews.`);

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const summaries = {
    'gis-field-services': 'Reviewers highlight flexible scheduling for independent contractors, but frequently criticize the very low pay, lack of expense reimbursement for vehicles, and poor communication from field managers.',
    'spotless-chimney-sweeping-solutions': 'Employee sentiment is highly polarized; some praise the great pay, hours, and growth opportunities, while many others describe a toxic, "cult-like" management style and poor work-life balance.',
    'altisource': 'Employees appreciate the collaborative environment and learning opportunities, but often cite concerns regarding job security, uneven workloads, and a lack of support from upper management.',
    'associated-services-inspectionsltd': 'Reviewers consistently praise the highly supportive management team, excellent communication, and flexible scheduling, noting travel reimbursement as the main area for improvement.',
    'topbuild': 'While some departments highlight supportive management and career advancement opportunities, other reviews point to concerns regarding job security, poor upper management support, and a challenging corporate culture.'
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
console.log(`Updated ${updated} firms in Batch 5 with real reviews.`);

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const summaries = {
    'field-nation': 'Independent contractors appreciate the flexibility to choose work and the daily pay options, but frequently report issues with poor support for technicians and occasional wage disputes or system errors.',
    'resource-pro-formerly-lowry-associates': 'While some team members enjoy the collaborative culture and time flexibility, others criticize the low pay, high turnover in operations, and instances of poor management behavior.',
    'roofstock': 'Employees value the remote work flexibility and commend senior leadership, but frequently cite frustration with poor middle management, lack of career development, and concerns over recent layoffs.',
    'safeguard-properties-management': 'Field inspectors enjoy the flexibility of setting their own schedules, but often describe middle management as disorganized and report that the low pay barely covers their expenses.',
    'hancock-claims-consultants': 'Feedback is mixed; some praise the competitive pay and good benefits, while others report a poor work-life balance due to understaffing and criticize management for inconsistency and favoritism.'
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
console.log(`Updated ${updated} firms in Batch 15 with real reviews.`);

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const summaries = {
    'regional-reporting': 'Reviewers highlight strong work-life balance and supportive office environments, though some feel the company has reduced inspector support and compensation over recent years.',
    'rimkus-consulting-group': 'Employees often praise the interesting, fast-paced work and solid benefits, but frequently cite a stressful environment with high pressure for quick report turnaround and a ' + "'top-heavy'" + ' management structure.',
    'western-field-services': 'While some team members appreciate the flexible schedules and decent pay, others describe poor management, an unpredictable on-call schedule, and a lack of overall company vision.',
    'cinch-home-services': 'Employee experiences vary; some enjoy the benefits and opportunities to learn, while many cite low pay, high-stress environments, and frequent management issues or lack of training.',
    'id-plans': 'Some employees value the flexibility to schedule their own work, but many reviews point out poor management support, vague compensation guidelines, and a lack of traditional benefits.'
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
console.log(`Updated ${updated} firms in Batch 11 with real reviews.`);

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const summaries = {
    'medspeed': 'While drivers appreciate the independence of the work, many note that the pay is relatively low for full-time work and cite inconsistent communication or poor support from local management.',
    'market-force-information': 'Mystery Shoppers value the extreme flexibility to choose assignments, but frequently mention that compensation is low and management communication can be lacking.',
    'nsf-international': 'Employees highlight a strong sense of community and flexibility, but lab and audit staff often report feeling overworked due to understaffing, high-pressure targets, and disorganized leadership.',
    'scale-ai-remotasks': 'Reviewers appreciate the flexible, remote, side-hustle nature of the work, but often complain about inconsistent task availability, technical platform bugs, and low pay for the effort required.',
    'telus-digital-ai': 'Workers enjoy the flexibility of remote schedules and participating in AI projects, but frequently note that tasks can become highly repetitive, communication is sparse, and pay growth is limited.'
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
console.log(`Updated ${updated} firms in Batch 16 with real reviews.`);

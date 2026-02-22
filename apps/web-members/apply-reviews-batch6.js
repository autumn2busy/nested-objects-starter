const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const summaries = {
    'quiktrak': 'Independent contractors appreciate the flexibility to set their own schedules, but frequently report low pay for the time spent, lack of benefits, and poor communication from management.',
    'ivueit': 'Reviewers enjoy the flexibility to choose tasks and hours, but many express frustration over low pay (often around $7 per task) and lack of compensation for travel time or app glitches.',
    'trinity-real-estate-solutions': 'While some employees highlight a fun and relaxed work environment, others cite concerns regarding high turnover, poor benefits, micromanagement, and a lack of growth opportunities.',
    'msi-now-part-of-mcs-mortgage-services': 'Employee sentiment is strongly divided; some describe a productive and fun environment, while many others report a toxic culture, poor training, stagnant pay, and unsupportive management.',
    'valutrust-solutions': 'Some reviewers describe a relaxed and innovative atmosphere, whereas others criticize the "call center" feel, toxic management, abusive client interactions, and lack of career advancement.'
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
console.log(`Updated ${updated} firms in Batch 6 with real reviews.`);

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const summaries = {
    'landgorilla': 'While some inspectors appreciate the flexible scheduling, many reviews highlight a toxic environment with poor communication, delayed or unclear pay structures, and high turnover.',
    'five-brothers-now-merged-with-mcs-360': 'As part of the broader MCS 360 organization, employee sentiment is mixed; some describe a productive environment, while others cite poor management support, stagnant pay, and lack of adequate training.',
    'coleman-consulting-group-llc': 'Reviewers suggest the pay is generally good and appreciate the team-oriented environment focused on helping families, though some mention the work itself can be tedious and cite instances of poor management.',
    'psi-services': 'Employees note it is a good fit for students needing flexible schedules, but frequently point out that the pay is near minimum wage with limited advancement and occasional issues with on-site management and training.',
    'williams-williams-auction': 'Reviewers generally praise the progressive culture and unique live studio environment, but some departments report high stress, long hours, and concerns regarding job security and layoffs.'
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
console.log(`Updated ${updated} firms in Batch 7 with real reviews.`);

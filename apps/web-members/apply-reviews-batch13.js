const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const summaries = {
    'xceedance': 'Employee reviews are highly polarizing; some praise the learning opportunities and fun culture in certain offices, while others criticize long hours, low pay, and poor management communication.',
    'ernst-young-llp': 'Reviews describe EY as an excellent place to build a career with strong learning opportunities and an inclusive culture, though many note the fast-paced public accounting environment often requires long hours and intense project demands.',
    'xactus': 'Overall sentiment is poor following a recent merger, with many employees reporting a chaotic work environment, below-average compensation, and leadership that feels disconnected from the staff.',
    'singlesource-property-solutions': 'While some find it a good entry-level environment with flexible scheduling, many reviews mention high turnover, low pay, and unprofessional or disorganized management.',
    'exl-overland-solutionsinc': 'Employees appreciate the flexible remote work for self-starters, but frequently cite a decline in company culture post-buyout, pointing to issues with stagnant pay, poor benefits, and limited advancement.'
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
console.log(`Updated ${updated} firms in Batch 13 with real reviews.`);

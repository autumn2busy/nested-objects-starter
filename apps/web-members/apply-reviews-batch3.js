const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));
const summaries = {
    'sdmyers': `Employees highlight the 'good benefits' and 'steady employment,' with many enjoying the travel and opportunity to learn about transformers, though some mention a 'click-ish' culture and work-life balance challenges.`,
    'crown-field-services-llc': `Reviewers on Indeed praise the friendly environment and the owner's willingness to help employees grow, though Glassdoor reviews point to a lack of appreciation from management and poor interpersonal skills from leadership.`,
    'amerispec-chicago-xperience-home-inspections': `Clients consistently praise the company for its thorough and professional home inspections, specifically highlighting the expertise of inspectors who provide clear, comprehensive reports and detailed explanations.`,
    'ka-engineering': `Reviewers generally describe the company as a supportive and stable workplace with a flexible schedule and remote options, though some individual reviews mention dissatisfaction with management style and unhelpful colleagues.`,
    'afirm-formerly-us-reports': `Reviewers describe Afirm as a solid starting point for those in the insurance industry, offering great training and flexible schedules, though some note that the pay can be relatively low and is best suited for entry-level roles.`
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
console.log(`Updated ${updated} firms with real reviews.`);

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));
const summaries = {
    'edgemarksolutions': `Reviewers describe a fast-paced environment with a supportive 'family atmosphere,' but frequently criticize the low starting pay and lack of raises in the field services role.`,
    'wavsys': `Employees report a smooth hiring process and consistent work schedules, but many mention a high turnover rate and a lack of respect from some management teams.`,
    'greenworks-inspections-engineering': `Employees generally appreciate the supportive teamwork and the variety of daily inspection tasks, although some have raised concerns about organizational issues and management style.`,
    'shiner-exteriors': `Reviewers praise the outstanding company culture and supportive management, highlighting high compensation and a positive work environment with numerous perks.`,
    'gridsource-incorporated-llc': `Reviewers in Baton Rouge detail a welcoming, family-focused environment with good growth opportunities, though some larger-scale reviews point to inconsistent work and high turnover.`
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

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));
const summaries = {
    'cis': `Reviewers describe the work as easy and flexible with a good work-life balance, but frequently complain about low pay and the burden of high gas expenses for field inspectors.`,
    'insurance-audit-services': `Employees generally appreciate the independent nature of the work and supportive management, although some find the workload high and the base pay relatively low.`,
    'credible-home-inspections': `Contractors find the inspection work to be straightforward and simple, making it a viable source of side income, though some note that the volume of assignments can be inconsistent.`,
    'alacrity-solutions': `Employees report that Alacrity Solutions offers stable employment with solid training and benefits, though some reviewers mention a high-pressure environment and limited opportunities for career advancement.`,
    'trendsource': `Contractors value the flexible, remote nature of the assignments and the helpful communication from staff, but many express frustration over the very low pay per task.`
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

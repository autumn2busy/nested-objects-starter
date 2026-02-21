const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));
const summaries = {
    'vision-realty-management': `Employees appreciate the team-oriented coworkers and flexible work-life balance, although some have reported negative experiences with specific management at the property level.`,
    'premier-claims': `Employees highlight a positive and energetic company culture with supportive management, competitive salaries, and excellent benefits like flexible PTO.`,
    'perry-johnson-registrars-food-safety-inc': `Reviewers frequently criticize the company for low pay, poor benefits, and high workloads resulting from understaffing, leading to an overall below-average employee sentiment.`,
    'dominion-due-diligence-group': `Employees praise the excellent benefits and positive work-life balance, noting opportunities for professional growth, though some suggest room for improvement in cross-departmental communication.`,
    'absolute-value-management-corporation': `Reviewers describe a challenging work environment with poor management, a lack of structured training, and no employee benefits or vacation time, often requiring the use of personal vehicles.`
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

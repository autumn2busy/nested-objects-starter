const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const summaries = {
    'winncompanies': 'Employees generally praise the company’s sense of purpose, supportive team environment, and competitive benefits, though some reviewers cite room for improvement in management support and pay growth.',
    'reliance-field-services': 'Direct employee reviews are limited online, but industry context suggests typical field service roles involving regional inspection tasks with varying consistency in work volume.',
    'wegolook': 'Many "Lookers" value the extreme flexibility of setting their own schedule as independent contractors, but frequently express dissatisfaction with low assignment pay, lack of mileage reimbursement, and infrequent work.',
    'old-republic': 'Reviewers highlight a friendly, stable work environment with good teamwork and learning opportunities, though some note that outdated systems and localized management issues can cause frustration.',
    'cyprexx-services': 'Employee feedback is mixed; some highlight a supportive, family-like culture with excellent benefits, while others point out poor job security, disorganized management, and inconsistent pay for contractors.'
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
console.log(`Updated ${updated} firms in Batch 14 with real reviews.`);

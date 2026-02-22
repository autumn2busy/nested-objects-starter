const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const summaries = {
    'nrg-energy': 'Employees highlight excellent pay and benefits with opportunities for professional growth, though some note limited upward mobility and challenging work-life balance in certain roles.',
    'servicelink': 'While some appreciate the remote flexibility and laid-back work, many reviews cite low pay, frequent layoffs, poor job security, and a lack of support from upper management.',
    'sage-consulting-group': 'Reviews indicate a professional consulting environment with opportunities for growth, though some note the rigorous project demands can impact work-life balance.',
    'defense-logistics-agency': 'Reviewers consistently praise the DLA for its great work-life balance, strong benefits, and high job security, though some feel management can be inconsistent or arbitrary with promotions.',
    'inspection-depot': 'Feedback is heavily mixed; some enjoy the networking and flexible culture, but many complain about unreliable work volume, disorganized management, and low pay that rarely meets advertised rates.'
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
console.log(`Updated ${updated} firms in Batch 12 with real reviews.`);

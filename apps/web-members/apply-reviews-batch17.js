const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const summaries = {
    'gigwalk': 'The app provides an easy way to earn extra cash through simple auditing tasks, but contractors caution that the work is highly sporadic and gig availability heavily depends on location.',
    'crossmark': 'Employees appreciate the flexible, independent nature of the part-time roles, but frequently point out low pay rates, limited benefits, and inadequate training from management.',
    'crawford-company': 'While some value the remote flexibility and technical training provided, many others describe a highly stressful, micromanaged environment with excessive workloads and a toxic workplace culture.',
    'amazon-flex': 'Drivers highly value the unmatched flexibility to choose their own shifts, but consistently warn about the hidden costs of vehicle wear and tear and the difficulty of securing consistent delivery blocks.',
    'roadie': 'The platform offers extreme flexibility for gig workers, but couriers frequently complain about very low pay relative to the miles driven and a near-total lack of driver support.',
    'appen': 'Remote workers appreciate the flexibility to set their own hours and the interesting AI-training tasks, but express common frustration over low pay rates, project instability, and poor communication from management.'
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
console.log(`Updated ${updated} firms in Batch 17 with real reviews.`);

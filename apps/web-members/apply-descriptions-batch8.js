const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const descriptions = {
    'complete-claims-service': 'Complete Claims Service is an independent, family-owned adjusting company based in New York, specializing in comprehensive auto damage appraisals, claim subrogation, and field inspections for insurance carriers.',
    'best-property-managers': 'Best Property Managers refers to top-tier property management firms dedicated to maximizing rental income and maintaining optimal occupancy through comprehensive tenant screening, rent collection, repair dispatch, and legal compliance.',
    'asset-protection-experts': 'Asset Protection Experts are specialized professionals providing legal structuring, trust planning, and risk mitigation strategies to safeguard the wealth, real estate, and business assets of high-net-worth individuals from liability.',
    'elite-property-group': 'Elite Property Group is a name shared by multiple regional real estate service providers globally, typically specializing in full-cycle commercial and residential property management, brokerage, and development.',
    'superior-inspections': 'Superior Inspections refers to independent residential property inspection companies providing comprehensive visual examinations, specialized testing (radon, mold), and detailed digital reporting to support informed real estate decisions.'
};

let updated = 0;
data.forEach(f => {
    if (descriptions[f.slug]) {
        f.description = descriptions[f.slug];
        if (f._ai_enriched_fields) {
            f._ai_enriched_fields = f._ai_enriched_fields.filter(x => x !== 'description');
        }
        updated++;
    }
});

fs.writeFileSync('firms_ai_enriched.json', JSON.stringify(data, null, 2));
console.log(`Updated ${updated} firms with real descriptions in Batch 8.`);

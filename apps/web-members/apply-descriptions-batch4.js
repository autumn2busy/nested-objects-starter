const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const descriptions = {
    'nspektr': 'Nspektr is a service provider focused on delivering clear, accurate, and actionable property inspection data, offering contractor matching and property intelligence services.',
    'quality-auditing': 'Quality Auditing LLC offers comprehensive quality management system (QMS) auditing services, performing internal, external, process, and product audits to ensure clients meet industry and regulatory standards.',
    'first-quality-environmental': 'First Quality Environmental is a licensed contracting firm in Hawaii specializing in residential and industrial wastewater treatment solutions, including septic systems, cesspool closures, and lift stations.',
    'topbuild': 'TopBuild Corp. is a Fortune 1000 company and a leading installer and specialty distributor of insulation and building material products across the United States and Canada.',
    'trinity-real-estate-solutions': 'Trinity Real Estate Solutions is a nationwide vendor management entity mitigating risk in construction lending through specialty inspections, digital draw solutions, surveys, and appraisal services.'
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
console.log(`Updated ${updated} firms with real descriptions in Batch 4.`);

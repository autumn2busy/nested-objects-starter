const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const descriptions = {
    'regional-reporting': 'Regional Reporting, Inc. (RRI) is a national consulting and insurance services firm specializing in localized loss prevention, risk assessments, and reporting across various geographic areas.',
    'rimkus-consulting-group': 'Rimkus Consulting Group is a privately-held international engineering and technical consulting firm specializing in forensic engineering, dispute resolution, and construction management for corporations, insurance carriers, and law firms.',
    'insurance-safety-consultants': 'Insurance Safety Consultants, LLC provides high-quality loss prevention services across the US, offering risk assessments, industrial hygiene, fleet safety, and property valuations to help companies minimize liabilities and lower insurance costs.',
    'coleman-consulting-group-llc': 'Coleman Consulting Group LLC is a woman-owned small business providing professional consulting and rapid-response technical assistance to the federal government, largely supporting FEMA disaster response and recovery missions.',
    'far-inspections': 'FAR Inspections is a nationwide field service company providing property condition reporting, occupancy verification, and disaster inspections for banks, mortgage servicers, and real estate investors.'
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
console.log(`Updated ${updated} firms with real descriptions in Batch 5.`);

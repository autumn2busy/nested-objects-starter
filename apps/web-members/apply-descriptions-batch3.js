const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const descriptions = {
    'nationwide-loss-control-services': 'Nationwide Loss Control Services, a division of Nationwide Mutual Insurance Company, provides risk management and safety consulting services, helping businesses identify hazards and implement custom safety programs.',
    'ja-brooks-management-corporation': 'J.A. Brooks is a UK-based mechanical services firm established in 1925, specializing in designing, engineering, and installing heating, water, and sanitation solutions spanning from public health infrastructure to commercial data centers.',
    'ccdi-llc': 'CCDI LLC is a national commercial and residential real estate consulting firm offering risk mitigation, construction consulting, property condition assessments, commercial draw inspections, and project management.',
    'amc-links': 'AMC Links is a nationwide Appraisal Management Company (AMC) providing fully compliant property appraisal management services, supported by manual quality control reviews and proprietary technology.',
    'ivueit': 'iVueit is a crowdsourced platform providing on-demand visualization and property verification services across the US, offering facilities management and real estate clients rapid turnaround for photos and surveys.'
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
console.log(`Updated ${updated} firms with real descriptions in Batch 3.`);

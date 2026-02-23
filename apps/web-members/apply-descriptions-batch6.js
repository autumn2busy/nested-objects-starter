const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const descriptions = {
    'trinity-property-consultants': 'Trinity Property Consultants is a national multifamily management firm offering services like asset management, property repositioning, and advanced IT solutions across various community environments.',
    'information-providers': 'Information Providers, Inc. (IPI) specializes in Property & Casualty and Premium Audit information services, offering physical, telephone, electronic, and voluntary audits for insurance companies nationwide.',
    'nan-amc': 'NAN (Nationwide Appraisal Network) is an innovative Appraisal Management Company utilizing data analytics and advanced technology to provide risk-based residential and commercial valuation products.',
    'asset-defense-llc': 'Asset Defense LLC is a full-service property management company in the Southeastern US offering property preservation, grass cutting, and inspections for investors and financial institutions.',
    'first-choice-consultants': 'Depending on location, First Choice Consultants may refer to an established business management and financial consulting firm, or a specialized care provider and staffing agency.'
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
console.log(`Updated ${updated} firms with real descriptions in Batch 6.`);

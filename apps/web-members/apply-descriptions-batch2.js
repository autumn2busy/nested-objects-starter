const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firms_ai_enriched.json', 'utf8'));

const descriptions = {
    'greenworks-environmental-safety-inc': 'GreenWorks Environmental is an environmental advisory and construction firm specializing in identifying environmental problems, indoor air quality testing, and advanced mold inspection and remediation for residential and commercial properties.',
    'perry-johnson-registrars': 'Perry Johnson Registrars (PJR) is a leading global management system certification body, providing internationally recognized auditing and registration services for standards like ISO 9001, AS9100, and ISO 14001 across various industries.',
    'dominion-due-diligence-group': 'Dominion Due Diligence Group (D3G) is a nationwide firm specializing in affordable housing due diligence, offering Capital Needs Assessments, environmental compliance, and energy sustainability consulting for the HUD-FHA-MAP mortgage insurance industry.',
    'bureau-veritas': 'Bureau Veritas is a global leader in testing, inspection, and certification (TIC) services, operating in over 140 countries to help clients navigate compliance related to quality, health, safety, and environmental regulations.',
    'nv5-global': 'NV5 Global is a leading provider of professional and technical engineering and consulting solutions, supporting sustainable infrastructure, utility services, and building assets through an integrated portfolio of TIC and geospatial services.'
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
console.log(`Updated ${updated} firms with real descriptions in Batch 2.`);

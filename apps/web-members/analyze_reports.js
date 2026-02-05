const fs = require('fs');
const path = require('path');

const reportDir = 'C:\\Users\\Mother\\Projects\\nested-objects-starter\\audit_reports';
const files = fs.readdirSync(reportDir).filter(f => f.endsWith('.json'));

const summary = [];

files.forEach(file => {
    try {
        let content = fs.readFileSync(path.join(reportDir, file), 'utf8');
        // Strip BOM
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
        const json = JSON.parse(content);

        if (!json.audits) return;

        const route = json.requestedUrl;
        const getValue = (key) => json.audits[key] ? json.audits[key].displayValue : 'N/A';

        const metrics = {
            'FCP': getValue('first-contentful-paint'),
            'LCP': getValue('largest-contentful-paint'),
            'TBT': getValue('total-blocking-time'),
            'CLS': getValue('cumulative-layout-shift'),
            'SpeedIndex': getValue('speed-index'),
            'Score': json.categories && json.categories.performance ? json.categories.performance.score * 100 : 'N/A'
        };

        summary.push({ route, file, metrics });
    } catch (e) {
        console.error(`Error parsing ${file}:`, e.message);
    }
});

console.log(JSON.stringify(summary, null, 2));

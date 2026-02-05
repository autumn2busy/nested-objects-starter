const fs = require('fs');
const path = require('path');

const registryPath = path.join(__dirname, '../audit_reports/unified_issue_registry.md');
const outputPath = path.join(__dirname, '../import_issues.bat');

try {
    const content = fs.readFileSync(registryPath, 'utf8');
    const lines = content.split('\n');

    let commands = [];
    commands.push('@echo off');
    commands.push('echo Import Audit Issues to GitHub...');
    commands.push('echo Ensure you are logged in with "gh auth login"');
    commands.push('pause');

    // Define Labels to Create
    const labels = [
        { name: 'Critical', color: 'B60205', desc: 'Critical severity' },
        { name: 'High', color: 'D93F0B', desc: 'High severity' },
        { name: 'Medium', color: 'FBCA04', desc: 'Medium severity' },
        { name: 'Low', color: '0E8A16', desc: 'Low severity' },
        { name: 'Security', color: 'FBCA04', desc: 'Security category' },
        { name: 'Performance', color: 'C2E0C6', desc: 'Performance category' },
        { name: 'UX', color: 'C5DEF5', desc: 'UX category' },
        { name: 'SEO', color: 'F9D0C4', desc: 'SEO category' },
        { name: 'Reliability', color: 'E99695', desc: 'Reliability category' },
        { name: 'Analytics', color: 'BFDADC', desc: 'Analytics category' },
        { name: 'QA', color: '1D76DB', desc: 'QA category' },
        { name: 'Data', color: '006B75', desc: 'Data category' },
        { name: 'Billing', color: '5319E7', desc: 'Billing category' },
        { name: 'Compliance', color: '0052CC', desc: 'Compliance category' }
    ];

    commands.push('echo Creating Labels...');
    labels.forEach(l => {
        commands.push(`call gh label create "${l.name}" --color "${l.color}" --description "${l.desc}" --force`);
    });

    // Parse Table
    let inTable = false;
    let headers = [];

    for (const line of lines) {
        if (line.trim().startsWith('| ID |')) {
            inTable = true;
            continue;
        }
        if (inTable && line.trim().startsWith('| :---')) {
            continue;
        }
        if (inTable && line.trim().startsWith('|')) {
            const parts = line.split('|').map(p => p.trim()).filter(p => p !== '');
            if (parts.length >= 7) {
                const id = parts[0].replace(/\*\*/g, '');
                const title = parts[1];
                const category = parts[2];
                const severity = parts[3];
                const finding = parts[4];
                const fix = parts[5];
                const effort = parts[6];

                const issueTitle = `[${id}] ${title}`;
                // Escape quotes for batch file
                const body = `## 🔎 Finding Description\\n**Audit ID:** ${id}\\n**Category:** ${category}\\n**Effort:** ${effort}\\n\\n## 📝 Evidence\\n${finding}\\n\\n## ⚠️ Risk & Impact\\n**Severity:** ${severity}\\n\\n## 🛠 Recommended Fix\\n${fix}\\n`
                    .replace(/"/g, '\\"')
                    .replace(/`/g, '`'); // Batch handling of special chars is tricky, keeps simple

                const cmd = `call gh issue create --title "${issueTitle}" --body "${body}" --label "${category},${severity},audit"`;
                commands.push(cmd);
            }
        }
    }

    commands.push('echo Done!');
    fs.writeFileSync(outputPath, commands.join('\n'));
    console.log('Generated import_issues.bat');

} catch (err) {
    console.error('Error:', err);
}

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const AC_API_URL = process.env.AC_API_URL;
const AC_API_KEY = process.env.AC_API_KEY;

if (!AC_API_URL || !AC_API_KEY) {
    console.error("Missing ActiveCampaign URL or Key in environment variables.");
    process.exit(1);
}

async function fetchAutomations() {
    console.log("Fetching automations from ActiveCampaign...");

    try {
        const url = `${AC_API_URL}/api/3/automations?limit=100`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Api-Token': AC_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        console.log(`\n--- ACTIVE AUTOMATIONS AUDIT ---`);
        console.log(`Total Automations Found: ${data.automations.length}`);

        const activeAutomations = data.automations.filter(a => a.status === '1');
        console.log(`Currently Active Automations: ${activeAutomations.length}\n`);

        activeAutomations.forEach(a => {
            console.log(`ID: ${a.id.padEnd(5)} | Name: ${a.name}`);
        });

        fs.writeFileSync('ac_automations_audit.json', JSON.stringify(data.automations, null, 2));
        console.log('\nFull automation data saved to ac_automations_audit.json');

    } catch (error) {
        console.error("Error fetching automations:", error.message);
    }
}

fetchAutomations();

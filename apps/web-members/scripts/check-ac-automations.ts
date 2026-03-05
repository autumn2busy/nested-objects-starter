import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.AC_API_URL;
const key = process.env.AC_API_KEY;

async function checkAllAutomations() {
    try {
        const res = await fetch(`${url}/api/3/automations?limit=100`, {
            headers: { 'Api-Token': key! }
        });
        const data = await res.json();

        for (const auto of data.automations) {
            if (auto.status === '1' || auto.status === 1 || auto.id === '484') {
                const trigRes = await fetch(`${url}/api/3/automations/${auto.id}/triggers`, {
                    headers: { 'Api-Token': key! }
                });
                const trigData = await trigRes.json();

                console.log(`\n=========================================`);
                console.log(`Name:   ${auto.name} (ID: ${auto.id}) -- Status: ${auto.status === '1' ? 'Active' : 'Inactive'}`);
                if (trigData.automationTriggers) {
                    trigData.automationTriggers.forEach((t: any) => {
                        console.log(`  Trigger Type: ${t.type} | Tag/Value: ${t.params?.tag || t.params?.eventname || 'N/A'}`);
                    });
                }
            }
        }

    } catch (e) {
        console.error(e);
    }
}

checkAllAutomations();

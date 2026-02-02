const https = require('https');

const SUPABASE_URL = 'https://lzzghrjjsyzlvofpidis.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6emdocmpqc3l6bHZvZnBpZGlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM5ODIzMSwiZXhwIjoyMDc2OTc0MjMxfQ.AHo6KGmfmnwuZT8b5EwycM2iYMEJW0adMsGtjK-zF_g';

function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function main() {
    try {
        // Check specific firm
        const specific = await fetchJSON(`${SUPABASE_URL}/rest/v1/firms?slug=eq.rtr-services-inc&select=slug,phone,email`);
        console.log('RTR Services Status:', specific[0]);

        // Fetch next batch
        const firms = await fetchJSON(`${SUPABASE_URL}/rest/v1/firms?select=slug,name,url&phone=is.null&email=is.null&url=neq.&limit=30`);
        console.log('\nPotential Candidates:');
        firms.forEach(f => {
            console.log(`- ${f.slug} | ${f.name} | ${f.url}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

main();

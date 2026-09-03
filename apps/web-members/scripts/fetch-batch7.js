const https = require('https');

const { requireSupabaseServiceEnv } = require('./lib/supabase-service-env')
const { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_KEY } = requireSupabaseServiceEnv()

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
        const firms = await fetchJSON(`${SUPABASE_URL}/rest/v1/firms?select=slug,name&phone=is.null&email=is.null&url=neq.&limit=15&offset=5`);
        console.log('Candidates Batch 7:');
        firms.forEach(f => {
            console.log(`${f.slug}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

main();

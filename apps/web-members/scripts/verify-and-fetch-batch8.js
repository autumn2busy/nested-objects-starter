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
                    // Handle empty or error responses
                    if (res.statusCode >= 400) {
                        console.error(`Status: ${res.statusCode}, Data: ${data}`);
                        resolve([]);
                        return;
                    }
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
        // 1. Verify Batch 7 status (Sample check)
        const checkSlugs = ['2m-quality', 'resolution-group', 'drw-llc', 'fgi-services'];
        const query = checkSlugs.map(s => `slug=eq.${s}`).join('&or=');
        // Using correct PostgREST syntax for OR: slug=in.(a,b,c)
        // Actually for Supabase GET params: ?slug=in.(2m-quality,resolution-group,...)
        const slugList = checkSlugs.join(',');
        const status = await fetchJSON(`${SUPABASE_URL}/rest/v1/firms?slug=in.(${slugList})&select=slug,phone`);

        console.log('Batch 7 Verification Status:');
        status.forEach(f => {
            console.log(`${f.slug}: Phone=${f.phone}`);
        });

        // 2. Fetch new candidates (Batch 8)
        // Fetch where phone is null, offset 0 (since we assume we fixed the others, they should be gone)
        // If they aren't fixed, we'll see them again.
        const candidates = await fetchJSON(`${SUPABASE_URL}/rest/v1/firms?select=slug,name,url&phone=is.null&email=is.null&url=neq.&limit=20`);

        console.log('\nBatch 8 Candidates (Top 20 Missing Phone/Email):');
        candidates.forEach(f => {
            // Filter out known generic/bad ones if needed
            if (f.slug.includes('sure-point')) return;
            console.log(`CANDIDATE: ${f.slug} | ${f.name}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

main();

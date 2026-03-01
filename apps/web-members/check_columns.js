const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lzzghrjjsyzlvofpidis.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6emdocmpqc3l6bHZvZnBpZGlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM5ODIzMSwiZXhwIjoyMDc2OTc0MjMxfQ.AHo6KGmfmnwuZT8b5EwycM2iYMEJW0adMsGtjK-zF_g';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function check() {
    const { data, error } = await supabase.from('firms').select('*');
    if (error) return console.error(error);

    if (!data || data.length === 0) {
        return console.log('No data found');
    }

    const total = data.length;
    const keys = Object.keys(data[0]);
    const stats = {};

    for (const key of keys) {
        let missingCount = 0;
        for (const d of data) {
            const val = d[key];
            if (val === null || val === undefined || val === '' || val === 'N/A' || val === 'Unknown' || val === 'Unverified') {
                missingCount++;
            }
        }
        stats[key] = {
            missing: missingCount,
            pct: Math.round((missingCount / total) * 100)
        };
    }

    const sorted = Object.entries(stats).sort((a, b) => b[1].missing - a[1].missing);

    console.log(`Total records: ${total}\n`);
    console.log('--- Missing Data Statistics ---');
    for (const [k, v] of sorted) {
        if (v.missing > 0 && v.missing < total) {
            console.log(`${k.padEnd(25)} : ${v.missing} missing (${v.pct}%)`);
        }
    }
}

check();

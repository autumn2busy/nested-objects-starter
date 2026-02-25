const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const lines = envLocal.split('\n');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of lines) {
    if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        supabaseUrl = line.substring('NEXT_PUBLIC_SUPABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '');
    } else if (line.trim().startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
        supabaseKey = line.substring('SUPABASE_SERVICE_ROLE_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
    }
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data: tpData, error: tpError } = await supabase.from('training_progress').select('*').limit(1);
    console.log('training_progress keys:', tpData && tpData.length > 0 ? Object.keys(tpData[0]) : tpError);

    const { data: qaData, error: qaError } = await supabase.from('quiz_attempts').select('*').limit(1);
    console.log('quiz_attempts keys:', qaData && qaData.length > 0 ? Object.keys(qaData[0]) : qaError);
}

checkSchema().catch(console.error);

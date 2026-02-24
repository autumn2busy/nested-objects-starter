const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const lines = envLocal.split('\n');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of lines) {
    if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim().replace(/^['"]|['"]$/g, '');
    } else if (line.trim().startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
        supabaseKey = line.split('=')[1].trim().replace(/^['"]|['"]$/g, '');
    }
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: qa, error: qaErr } = await supabase.from('quiz_attempts').select('*').limit(1);
    console.log('Quiz Attempts Sample:', JSON.stringify(qa, null, 2));

    const { data: tp, error: tpErr } = await supabase.from('training_progress').select('*').limit(1);
    console.log('Training Progress Sample:', JSON.stringify(tp, null, 2));
}

run();

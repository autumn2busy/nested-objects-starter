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
    const { data, error } = await supabase.rpc('query_sql', {
        sql: `
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('profiles', 'training_progress', 'quiz_attempts')
      AND column_name IN ('id', 'user_id', 'outseta_person_uid', 'profile_id');
    `
    });

    if (error) {
        console.error('RPC failed, trying raw data logic', error.message);
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
}

run();

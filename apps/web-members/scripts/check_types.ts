import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkTypes() {
    const { data, error } = await supabase
        .from('training_modules')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    const row = data[0];
    console.log('--- Data Types in training_modules ---');
    for (const key in row) {
        console.log(`${key}: ${typeof row[key]} (${row[key]})`);
    }
}

checkTypes();

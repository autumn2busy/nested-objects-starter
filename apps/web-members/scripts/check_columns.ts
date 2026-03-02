import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSchema() {
    const { data, error } = await supabase
        .from('training_modules')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Columns in training_modules:', Object.keys(data[0]));
}

checkSchema();

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkUserIds() {
    const { data: attempts, error } = await supabase
        .from('quiz_attempts')
        .select('user_id')
        .limit(100);

    if (error) {
        console.error('Error:', error);
        return;
    }

    const ids = new Set(attempts.map(a => a.user_id));
    console.log('Unique user_ids in quiz_attempts:', Array.from(ids));

    // Check format
    ids.forEach(id => {
        if (id.length > 20) {
            console.log(`potential UUID format: ${id}`);
        } else {
            console.log(`potential Outseta format: ${id}`);
        }
    });
}

checkUserIds();

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkModuleIds() {
    const { data: attempts, error } = await supabase
        .from('quiz_attempts')
        .select('module_id')
        .eq('passed', true);

    if (error) {
        console.error('Error:', error);
        return;
    }

    const ids = new Set(attempts.map(a => a.module_id));
    console.log('Unique module_ids for passed quiz_attempts:', Array.from(ids));

    // Check format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    ids.forEach(id => {
        if (uuidRegex.test(id)) {
            console.log(`Validated UUID: ${id}`);
        } else {
            console.log(`NOT A UUID (Potential Slug/Old ID): ${id}`);
        }
    });
}

checkModuleIds();

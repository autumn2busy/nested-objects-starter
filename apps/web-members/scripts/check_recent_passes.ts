import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkRecentPasses() {
    const mod5Id = '78736c5e-66ab-4919-9ca1-fdae022b2525';

    const { data: attempts, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('module_id', mod5Id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Recent attempts for Module 5:`, attempts.length);
    attempts.forEach(a => {
        console.log(`User: ${a.user_id}, Passed: ${a.passed}, Score: ${a.score}, ID: ${a.id}`);
    });
}

checkRecentPasses();

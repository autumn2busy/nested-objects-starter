import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkStatus() {
    console.log('--- Fetching all users ---');
    const { data: profiles } = await supabase.from('profiles').select('user_id, email, full_name, training_modules_completed').limit(10);

    if (profiles && profiles.length > 0) {
        const user = profiles[0]; // Take the first one or we can search for the beta tester
        console.log(`Checking for user: ${user.email} (${user.user_id})`);

        const { data: attempts } = await supabase.from('quiz_attempts').select('*').eq('user_id', user.user_id);
        console.log('\nQuiz Attempts:');
        console.log(attempts);

        const { data: progress } = await supabase.from('training_progress').select('*').eq('user_id', user.user_id);
        console.log('\nTraining Progress:');
        console.log(progress);

        const { data: modules } = await supabase.from('training_modules').select('id, title, module_number').order('module_number');
        console.log('\nModules:');
        console.log(modules);

    } else {
        console.log('No profiles found to check.');
    }
}

checkStatus();

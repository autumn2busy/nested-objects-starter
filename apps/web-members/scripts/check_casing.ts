import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkCasing() {
    const { data: modules } = await supabase.from('training_modules').select('id, title');
    const { data: attempts } = await supabase.from('quiz_attempts').select('module_id').limit(100);

    console.log('--- Training Modules IDs ---');
    modules?.forEach(m => console.log(`${m.id} (${m.title})`));

    console.log('\n--- Quiz Attempts IDs ---');
    attempts?.forEach(a => console.log(a.module_id));

    // Check if any have uppercase letters
    const hasUpper = (str: string) => /[A-Z]/.test(str);

    const upperModules = (modules || []).filter(m => hasUpper(m.id));
    const upperAttempts = (attempts || []).filter(a => hasUpper(a.module_id));

    if (upperModules?.length > 0) console.log('\n!!! UPPERCASE FOUND IN MODULES:', upperModules);
    if (upperAttempts.length > 0) console.log('\n!!! UPPERCASE FOUND IN ATTEMPTS:', upperAttempts);
}

checkCasing();

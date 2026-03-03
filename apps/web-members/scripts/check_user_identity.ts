import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkUser() {
    const email = 'autumn.s.williams+elite@gmail.com';

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, user_id, outseta_person_uid, email')
        .eq('email', email)
        .single();

    if (!profile) {
        console.log('Profile not found for', email);
        return;
    }

    console.log('Profile:', profile);

    const canonicalId = profile.user_id || profile.outseta_person_uid || profile.id;
    console.log('Checking attempts for canonical ID:', canonicalId);

    const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('*')
        .in('user_id', [profile.outseta_person_uid, profile.id, canonicalId]);

    console.log(`Found ${attempts?.length || 0} attempts across all IDs.`);

    attempts?.forEach(a => {
        console.log(`[${a.user_id}] Module ${a.module_id} - Score: ${a.score}, Passed: ${a.passed}, Attempt: ${a.attempt_number}`);
    });
}

checkUser();

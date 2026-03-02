import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkMismatch() {
    const mod5Id = '78736c5e-66ab-4919-9ca1-fdae022b2525';

    // 1. Get all passed attempts for Mod 5
    const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('user_id, profile_id')
        .eq('module_id', mod5Id)
        .eq('passed', true);

    console.log(`Users who passed Mod 5:`, attempts?.length || 0);

    for (const attempt of (attempts || [])) {
        // 2. Lookup profile for this user_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, user_id, outseta_person_uid, email, full_name')
            .or(`user_id.eq.${attempt.user_id},outseta_person_uid.eq.${attempt.user_id}`)
            .single();

        if (profile) {
            console.log(`Match: ${attempt.user_id} -> ${profile.full_name} (${profile.email})`);
            console.log(`  Profile IDs: user_id=${profile.user_id}, outseta_person_uid=${profile.outseta_person_uid}`);
        } else {
            console.log(`MISSING PROFILE for user_id: ${attempt.user_id}`);
        }
    }
}

checkMismatch();

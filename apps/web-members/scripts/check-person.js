import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkUserProfile() {
    const userId = 'QGereJeW';

    const { data: profile } = await supabase
        .from('profiles')
        .select('plan_uid, plan_name, training_modules_completed, training_modules_total')
        .eq('user_id', userId)
        .single();

    console.log(`Profile for ${userId}:`, profile);
}

checkUserProfile();

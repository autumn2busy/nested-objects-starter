import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!global.crypto) {
    global.crypto = require('crypto').webcrypto;
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
    const { data, error } = await supabase
        .from('profiles')
        .select('email, ac_contact_id, ac_customer_id, plan_name, subscription_tier, created_at, outseta_updated_at, outseta_account_id, outseta_person_uid, plan_uid, subscription_status, outseta_data, subscription_start_date, subscription_end_date')
        .eq('email', 'autumn.s.williams+acsynctest@gmail.com')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        const fs = require('fs');
        fs.writeFileSync('profiles-out.json', JSON.stringify(data, null, 2), 'utf-8');
        console.log('Saved to profiles-out.json');
    }
}

run();

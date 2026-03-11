// Force AC vars BEFORE imports to guarantee they are available
process.env.ACTIVE_CAMPAIGN_API_URL = process.env.AC_API_URL || '';
process.env.ACTIVE_CAMPAIGN_API_KEY = process.env.AC_API_KEY || '';
process.env.ACTIVE_CAMPAIGN_CONNECTION_ID = process.env.AC_CONNECTION_ID || '1';

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env before importing lib files
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

process.env.ACTIVE_CAMPAIGN_API_URL = process.env.NEXT_PUBLIC_AC_API_URL || process.env.ACTIVE_CAMPAIGN_API_URL;
process.env.ACTIVE_CAMPAIGN_API_KEY = process.env.AC_API_KEY || process.env.ACTIVE_CAMPAIGN_API_KEY;
process.env.ACTIVE_CAMPAIGN_CONNECTION_ID = process.env.NEXT_PUBLIC_AC_ACTID || '1';

import { createServiceRoleClient } from './lib/supabase-admin';
import { syncFullProfileDeepData } from './lib/active-campaign-deep-data';
import { PLAN_UIDS } from './lib/plan-config';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function fixRashaud() {
    const email = 'bushr94@gmail.com';
    console.log(`Fixing profile for: ${email}`);

    const supabase = createServiceRoleClient();

    // 1. Fetch current profile
    const { data: profile, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_email', email)
        .single();

    if (fetchErr || !profile) {
        console.error('Failed to fetch profile:', fetchErr);
        return;
    }

    console.log('Current Tier:', profile.subscription_tier);

    // 2. Update to founders
    console.log('Updating to Founders...');
    const { data: updatedProfile, error: updateErr } = await supabase
        .from('profiles')
        .update({
            subscription_tier: 'founders',
            plan_uid: PLAN_UIDS.FOUNDERS,
            plan_name: 'Founders Directory Annual. Grandfathered',
            subscription_status: 'active'
        })
        .eq('user_email', email)
        .select('*')
        .single();

    if (updateErr || !updatedProfile) {
        console.error('Failed to update profile:', updateErr);
        return;
    }

    console.log('Updated Profile successfully in Supabase.');

    // 3. Force AC Deep Data Sync
    console.log('Triggering AC Deep Data Sync...');
    const result = await syncFullProfileDeepData(updatedProfile);
    console.log('AC Sync Logs:\n', result.logs.join('\n'));
}

fixRashaud();

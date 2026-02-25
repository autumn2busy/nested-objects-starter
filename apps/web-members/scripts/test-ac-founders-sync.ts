import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local BEFORE importing logic
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Polyfill crypto for Supabase
if (!global.crypto) {
    global.crypto = require('crypto').webcrypto;
}

import { ProfileUpdateData } from '../app/api/webhooks/outseta/route';

const mockFoundersProfile: ProfileUpdateData = {
    outseta_person_uid: 'test-founder-person-001',
    outseta_account_id: 'test-founder-account-001',
    user_email: 'antigravity-founder-test@example.com',
    email: 'antigravity-founder-test@example.com',
    first_name: 'Antigravity',
    last_name: 'Founder',
    full_name: 'Antigravity Founder',
    display_name: 'Antigravity Founder',
    phone: '555-0200',
    subscription_tier: 'founders',
    subscription_status: 'active',
    subscription_start_date: new Date().toISOString(),
    subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    plan_uid: 'pWrBRnWn', // Real Founders Plan UID
    plan_name: 'Founders Membership',
    billing_renewal_term: 1, // 1 Year
    outseta_created_at: new Date().toISOString(),
    outseta_updated_at: new Date().toISOString(),
    outseta_data: { Referer: 'https://nestedobjects.com?utm_source=test_script' },
    last_login_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
};

async function runTest() {
    console.log("Starting AC Founders Sync Test...");
    console.log("Mock Profile:", mockFoundersProfile.email);

    try {
        const { syncFullProfileDeepData } = await import('../lib/active-campaign-deep-data');
        const result = await syncFullProfileDeepData(mockFoundersProfile);
        require('fs').writeFileSync('ac-sync-result.json', JSON.stringify(result.logs, null, 2));
        console.log("=== Sync complete. Check ac-sync-result.json ===");
    } catch (e) {
        console.error("Test Failed:", e);
    }
}

runTest();

import { NextResponse } from 'next/server';
import { syncFullProfileDeepData } from '@/lib/active-campaign-deep-data';
import { ProfileUpdateData } from '../webhooks/outseta/route';

export const dynamic = 'force-dynamic';

export async function GET() {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Dummy profile for testing
    const dummyProfile: ProfileUpdateData = {
        outseta_person_uid: 'test-person-123',
        outseta_account_id: 'test-account-456',
        user_email: 'test-ac-sync@example.com',
        email: 'test-ac-sync@example.com',
        first_name: 'Test',
        last_name: 'Sync',
        full_name: 'Test Sync',
        display_name: 'Test Sync',
        phone: null,
        subscription_tier: 'pro',
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: null,
        plan_uid: 'rQVqlLm6', // Pro plan
        plan_name: 'Pro Membership',
        billing_renewal_term: 1,
        outseta_created_at: new Date().toISOString(),
        outseta_updated_at: new Date().toISOString(),
        outseta_data: {},
        last_login_at: null,
        last_active_at: new Date().toISOString()
    };

    const result = await syncFullProfileDeepData(dummyProfile);

    return NextResponse.json({
        message: 'Sync triggered',
        profile: dummyProfile.email,
        logs: result.logs
    });
}

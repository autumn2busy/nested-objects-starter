// =========================================
// Outseta Webhook Handler (Fixed for Outseta's Actual Format)
// Path: app/api/webhooks/outseta/route.ts
// Purpose: Handle Outseta webhooks that send raw Account objects
// =========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Get Supabase client (lazy initialization)
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Map Outseta subscription plan to our tier enum
 */
function mapOutsetaPlanToTier(planName: string | undefined): string {
  if (!planName) return 'free';

  const normalized = planName.toLowerCase();

  if (normalized.includes('agency')) return 'agency';
  if (normalized.includes('elite')) return 'elite';
  if (normalized.includes('pro')) return 'pro';
  if (normalized.includes('starter')) return 'free';

  return 'free';
}

/**
 * Map Outseta subscription status to our status enum
 */
function mapOutsetaStatus(status: string | undefined): string {
  if (!status) return 'active';

  const normalized = status.toLowerCase();

  if (normalized === 'active') return 'active';
  if (normalized === 'trialing') return 'trialing';
  if (normalized === 'pastdue') return 'past_due';
  if (normalized === 'canceled') return 'canceled';
  if (normalized === 'paused') return 'paused';

  return 'active';
}

/**
 * Extract profile data from Outseta payload
 * Handles both event-wrapped and raw Account objects
 */
function extractProfileData(payload: any) {
  const objectType = payload._objectType;

  let account: any = null;
  let person: any = null;
  let subscription: any = null;

  if (objectType === 'Person') {
    person = payload;
    // Person payloads often include Account info or at least links
    // If deeply nested:
    account = payload.Account;
    // Person payloads might not have subscription info attached directly
  } else {
    // Default to Account assumption
    account = payload.Account || payload;
    person = payload.Person || payload.PrimaryContact || account?.PrimaryContact;
    subscription = payload.Subscription || account?.Subscriptions?.[0];
  }

  console.log('🔍 Extracting from:', {
    type: objectType || 'Unknown',
    hasAccount: !!account,
    hasPerson: !!person,
    personEmail: person?.Email,
  });

  // Safe mapping that doesn't overwrite with defaults if unknown
  const subTier = subscription?.Plan?.Name ? mapOutsetaPlanToTier(subscription.Plan.Name) : undefined;
  const subStatus = subscription?.SubscriptionStatus ? mapOutsetaStatus(subscription.SubscriptionStatus) : undefined;

  return {
    outseta_account_id: account?.Uid || null, // Might be null if just Person update, but RPC usually needs email
    email: person?.Email || account?.PrimaryContact?.Email,
    first_name: person?.FirstName || account?.PrimaryContact?.FirstName || '',
    last_name: person?.LastName || account?.PrimaryContact?.LastName || '',
    phone: person?.PhoneMobile || person?.PhoneWork || null,
    // Only include subscription fields if we actually found them, otherwise let RPC handle defaults or existing
    ...(subTier && { subscription_tier: subTier }),
    ...(subStatus && { subscription_status: subStatus }),
    // subscription_start_date: subscription?.StartDate || null, // Optional, skipped for now to avoid overwriting
  };
}

/**
 * Upsert profile to Supabase
 */
async function upsertProfile(profileData: any, rawPayload: any) {
  const supabase = getSupabaseClient();

  try {
    console.log('💾 Upserting profile:', profileData);

    // Call the upsert_profile function we created in SQL
    const { data, error } = await supabase.rpc('upsert_profile', {
      p_outseta_account_id: profileData.outseta_account_id,
      p_email: profileData.email,
      p_first_name: profileData.first_name,
      p_last_name: profileData.last_name,
      p_subscription_tier: profileData.subscription_tier,
      p_subscription_status: profileData.subscription_status,
      p_outseta_data: rawPayload,
    });

    if (error) {
      console.error('❌ Supabase upsert error:', error);
      throw error;
    }

    console.log('✅ Profile upserted successfully! ID:', data);
    return data;
  } catch (error) {
    console.error('💥 Failed to upsert profile:', error);
    throw error;
  }
}

/**
 * POST handler for Outseta webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body
    const rawBody = await request.text();

    // Parse payload
    const payload = JSON.parse(rawBody);

    // Check if it's an Account or Person object
    const isAccountObject = payload._objectType === 'Account' || (payload.Uid && !payload.FirstName); // Heuristic
    const isPersonObject = payload._objectType === 'Person' || (payload.Uid && payload.FirstName);

    console.log('📨 Received Outseta webhook:', {
      objectType: payload._objectType,
      uid: payload.Uid,
      email: payload.Email || payload.PrimaryContact?.Email,
      isAccount: isAccountObject,
      isPerson: isPersonObject,
      timestamp: new Date().toISOString(),
    });

    if (!isAccountObject && !isPersonObject) {
      console.log('⏭️  Not an Account or Person object, skipping');
      return NextResponse.json({
        received: true,
        skipped: true,
        reason: 'Not an Account or Person object',
      });
    }

    // Extract profile data
    const profileData = extractProfileData(payload);

    console.log('👤 Extracted profile data:', profileData);

    if (!profileData.email) {
      console.error('❌ Missing required profile data: email');

      return NextResponse.json(
        {
          error: 'Missing required profile data',
          missing: {
            email: !profileData.email,
          },
          received_data: profileData,
        },
        { status: 400 }
      );
    }

    if (!profileData.outseta_account_id) {
      console.warn('⚠️  Proceeding with upsert using Email only (Account ID missing from payload)');
    }

    // Upsert to Supabase
    const profileId = await upsertProfile(profileData, payload);

    // Return success
    return NextResponse.json({
      success: true,
      profile_id: profileId,
      email: profileData.email,
      message: 'Profile synced successfully to Supabase',
    });

  } catch (error) {
    console.error('💥 Webhook processing error:', error);

    // Return 500 so Outseta retries
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for health check
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // Test Supabase connection
    const { error } = await supabase.from('profiles').select('count').limit(1);

    return NextResponse.json({
      status: error ? 'unhealthy' : 'healthy',
      endpoint: '/api/webhooks/outseta',
      supabase_connected: !error,
      signature_verification: 'DISABLED (debugging mode)',
      payload_format: 'Raw Account objects (not event-wrapped)',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      endpoint: '/api/webhooks/outseta',
      supabase_connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
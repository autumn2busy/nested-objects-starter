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
  // Outseta sends raw Account objects, not wrapped events
  const account = payload.Account || payload;
  const person = payload.Person || payload.PrimaryContact || account?.PrimaryContact;
  const subscription = payload.Subscription || account?.Subscriptions?.[0];
  
  console.log('🔍 Extracting from:', {
    hasAccount: !!account,
    hasPerson: !!person,
    hasSubscription: !!subscription,
    accountUid: account?.Uid,
    personEmail: person?.Email,
  });
  
  return {
    outseta_account_id: account?.Uid,
    email: person?.Email,
    first_name: person?.FirstName || '',
    last_name: person?.LastName || '',
    phone: person?.PhoneMobile || person?.PhoneWork || null,
    subscription_tier: mapOutsetaPlanToTier(subscription?.Plan?.Name),
    subscription_status: mapOutsetaStatus(subscription?.SubscriptionStatus || 'active'),
    subscription_start_date: subscription?.StartDate || null,
    subscription_end_date: subscription?.EndDate || null,
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

    // Check if it's an Account object (has Uid and _objectType)
    const isAccountObject = payload._objectType === 'Account' || payload.Uid;
    
    console.log('📨 Received Outseta webhook:', {
      objectType: payload._objectType,
      accountUid: payload.Uid,
      primaryContactEmail: payload.PrimaryContact?.Email,
      isAccountObject,
      timestamp: new Date().toISOString(),
    });

    // Outseta sends raw Account objects, not event-wrapped payloads
    if (!isAccountObject) {
      console.log('⏭️  Not an Account object, skipping');
      return NextResponse.json({
        received: true,
        skipped: true,
        reason: 'Not an Account object',
      });
    }

    // Extract profile data
    const profileData = extractProfileData(payload);

    console.log('👤 Extracted profile data:', profileData);

    if (!profileData.outseta_account_id || !profileData.email) {
      console.error('❌ Missing required profile data');
      console.error('   Account ID:', profileData.outseta_account_id);
      console.error('   Email:', profileData.email);
      
      return NextResponse.json(
        { 
          error: 'Missing required profile data',
          missing: {
            account_id: !profileData.outseta_account_id,
            email: !profileData.email,
          },
          received_data: profileData,
        },
        { status: 400 }
      );
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
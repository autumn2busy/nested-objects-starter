// =========================================
// Outseta Webhook Handler (Debug Version - Signature Check Disabled)
// Path: app/api/webhooks/outseta/route.ts
// Purpose: Temporarily bypass signature to debug sync issue
// =========================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
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
 * Extract profile data from Outseta webhook payload
 */
function extractProfileData(payload: any) {
  const account = payload.Account || payload.account;
  const person = payload.Person || payload.person || account?.PrimaryContact;
  const subscription = payload.Subscription || payload.subscription || account?.Subscriptions?.[0];
  
  return {
    outseta_account_id: account?.Uid || account?.uid,
    email: person?.Email || person?.email,
    first_name: person?.FirstName || person?.firstName,
    last_name: person?.LastName || person?.lastName,
    phone: person?.Phone || person?.phone,
    subscription_tier: mapOutsetaPlanToTier(subscription?.Plan?.Name || subscription?.plan?.name),
    subscription_status: mapOutsetaStatus(subscription?.SubscriptionStatus || subscription?.status),
    subscription_start_date: subscription?.StartDate || subscription?.startDate,
    subscription_end_date: subscription?.EndDate || subscription?.endDate,
  };
}

/**
 * Upsert profile to Supabase
 */
async function upsertProfile(profileData: any, rawPayload: any) {
  const supabase = getSupabaseClient();

  try {
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
      console.error('Supabase upsert error:', error);
      throw error;
    }

    console.log('✅ Profile upserted successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to upsert profile:', error);
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
    
    // Log all headers for debugging
    console.log('📥 Webhook Headers:', Object.fromEntries(request.headers.entries()));
    
    // Parse payload
    const payload = JSON.parse(rawBody);
    const eventType = payload.EventType || payload.eventType;

    console.log('📨 Received Outseta webhook:', {
      eventType,
      accountId: payload.Account?.Uid,
      timestamp: new Date().toISOString(),
    });

    // Log full payload for debugging
    console.log('📦 Full payload:', JSON.stringify(payload, null, 2));

    // Only process account-related events
    if (!eventType || !eventType.toLowerCase().includes('account')) {
      console.log('⏭️  Skipping non-account event:', eventType);
      return NextResponse.json({
        received: true,
        skipped: true,
        event_type: eventType,
        message: 'Only account events are processed',
      });
    }

    // Extract profile data
    const profileData = extractProfileData(payload);

    console.log('👤 Extracted profile data:', profileData);

    if (!profileData.outseta_account_id || !profileData.email) {
      console.error('❌ Missing required profile data:', profileData);
      return NextResponse.json(
        { 
          error: 'Missing required profile data',
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
      event_type: eventType,
      profile_id: profileId,
      email: profileData.email,
      message: 'Profile synced successfully',
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
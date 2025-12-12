// =========================================
// Outseta Webhook Handler (Direct Supabase Sync)
// Path: app/api/webhooks/outseta/route.ts
// Purpose: Receive Outseta webhooks and sync directly to Supabase
// NO N8N REQUIRED
// =========================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * Get Supabase client (lazy initialization)
 * This prevents build-time errors when env vars aren't available
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
 * Verify Outseta webhook signature
 */
function verifyOutsetaSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    console.error('Missing X-Outseta-Signature header');
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
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

    console.log('Profile upserted successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to upsert profile:', error);
    throw error;
  }
}

/**
 * Sync to ActiveCampaign (optional)
 */
async function syncToActiveCampaign(profileData: any) {
  const AC_API_URL = process.env.AC_API_URL;
  const AC_API_KEY = process.env.AC_API_KEY;

  if (!AC_API_URL || !AC_API_KEY) {
    console.log('ActiveCampaign not configured, skipping sync');
    return null;
  }

  try {
    // Create or update contact
    const response = await fetch(`${AC_API_URL}/api/3/contact/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Token': AC_API_KEY,
      },
      body: JSON.stringify({
        contact: {
          email: profileData.email,
          firstName: profileData.first_name,
          lastName: profileData.last_name,
          fieldValues: [
            {
              field: '1', // Adjust field ID based on your AC setup
              value: profileData.subscription_tier,
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ActiveCampaign sync failed:', errorText);
      return null;
    }

    const result = await response.json();
    console.log('Synced to ActiveCampaign:', result.contact.id);

    // Add tags
    if (result.contact?.id) {
      await fetch(`${AC_API_URL}/api/3/contactTags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Token': AC_API_KEY,
        },
        body: JSON.stringify({
          contactTag: {
            contact: result.contact.id,
            tag: 'new_member',
          },
        }),
      });

      // Add tier-specific tag
      await fetch(`${AC_API_URL}/api/3/contactTags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Token': AC_API_KEY,
        },
        body: JSON.stringify({
          contactTag: {
            contact: result.contact.id,
            tag: profileData.subscription_tier,
          },
        }),
      });
    }

    return result;
  } catch (error) {
    console.error('ActiveCampaign sync error:', error);
    return null;
  }
}

/**
 * POST handler for Outseta webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-outseta-signature');
    const webhookSecret = process.env.OUTSETA_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('OUTSETA_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify signature
    const isValid = verifyOutsetaSignature(rawBody, signature, webhookSecret);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    const payload = JSON.parse(rawBody);
    const eventType = payload.EventType || payload.eventType;

    console.log('Received Outseta webhook:', {
      eventType,
      accountId: payload.Account?.Uid,
      timestamp: new Date().toISOString(),
    });

    // Only process account-related events
    if (!eventType || !eventType.toLowerCase().includes('account')) {
      console.log('Skipping non-account event:', eventType);
      return NextResponse.json({
        received: true,
        skipped: true,
        event_type: eventType,
      });
    }

    // Extract profile data
    const profileData = extractProfileData(payload);

    if (!profileData.outseta_account_id || !profileData.email) {
      console.error('Missing required profile data');
      return NextResponse.json(
        { error: 'Missing required profile data' },
        { status: 400 }
      );
    }

    // Upsert to Supabase
    const profileId = await upsertProfile(profileData, payload);

    // Sync to ActiveCampaign (non-blocking)
    syncToActiveCampaign(profileData).catch(err => {
      console.error('ActiveCampaign sync failed (non-fatal):', err);
    });

    // Return success
    return NextResponse.json({
      success: true,
      event_type: eventType,
      profile_id: profileId,
      email: profileData.email,
      synced_to: ['supabase', 'activecampaign'],
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Return 500 so Outseta retries
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
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
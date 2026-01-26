// =================================================================
// /app/api/webhooks/outseta/route.ts
// Receives webhooks from Outseta and syncs to Supabase profiles
// Matches Nested Objects profiles table schema exactly
// =================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// =================================================================
// TYPES - Matching Outseta webhook payloads
// =================================================================

interface OutsetaPerson {
  Uid: string;
  Email: string;
  FirstName?: string;
  LastName?: string;
  FullName?: string;
  PhoneMobile?: string;
  PhoneWork?: string;
  IPAddress?: string;
  Referer?: string;
  UserAgent?: string;
  Created?: string;
  Updated?: string;
  LastLoginDateTime?: string;
}

interface OutsetaPlan {
  Uid: string;
  Name: string;
  MonthlyRate?: number;
  AnnualRate?: number;
  ContentGroups?: Array<{ Uid: string; Name: string }>;
}

interface OutsetaSubscription {
  Uid: string;
  BillingRenewalTerm?: number; // 1=Monthly, 2=Annual
  Plan?: OutsetaPlan;
  StartDate?: string;
  EndDate?: string;
  RenewalDate?: string;
  Rate?: number;
}

interface OutsetaPersonAccount {
  Uid: string;
  Person: OutsetaPerson;
  IsPrimary: boolean;
  Created?: string;
  Updated?: string;
}

interface OutsetaAccount {
  Uid: string;
  Name: string;
  AccountStage?: number;
  // AccountStage: 1=Trialing, 2=Subscribing, 3=Canceling, 4=Expired, 5=Canceled, 6=PastDue
  AccountStageLabel?: string;
  PersonAccount?: OutsetaPersonAccount[];
  Subscriptions?: OutsetaSubscription[];
  LatestSubscription?: OutsetaSubscription;
  CurrentSubscription?: OutsetaSubscription;
  Created?: string;
  Updated?: string;
}

type OutsetaWebhookPayload = OutsetaAccount | OutsetaPerson;

// Maps to your profiles table columns
interface ProfileUpsertData {
  // Outseta IDs
  outseta_person_uid: string;
  outseta_account_id: string | null;
  
  // User identity (user_email is your primary key)
  user_email: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  display_name: string | null;
  phone: string | null;
  
  // Subscription info
  subscription_tier: 'free' | 'pro' | 'elite' | 'agency';
  subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  plan_uid: string | null;
  plan_name: string | null;
  billing_renewal_term: number | null;
  
  // Outseta timestamps
  outseta_created_at: string | null;
  outseta_updated_at: string | null;
  
  // Store full payload for reference
  outseta_data: OutsetaAccount | OutsetaPerson;
  
  // Activity tracking
  last_login_at: string | null;
  last_active_at: string;
}

// =================================================================
// HELPERS
// =================================================================

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

function verifyOutsetaSignature(
  signature: string,
  bodyAsString: string,
  keyAsHex: string
): boolean {
  if (!signature || !keyAsHex) return false;
  
  try {
    const key = Buffer.from(keyAsHex, 'hex');
    const payloadToSign = Buffer.from(bodyAsString, 'utf-8');
    const calculatedSignature = crypto
      .createHmac('sha256', key)
      .update(payloadToSign)
      .digest('hex');
    
    return signature === `sha256=${calculatedSignature}`;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

function isAccountPayload(payload: OutsetaWebhookPayload): payload is OutsetaAccount {
  return 'PersonAccount' in payload || 'AccountStage' in payload;
}

/**
 * Map Outseta AccountStage to your subscription_status
 */
function mapAccountStageToStatus(stage?: number): ProfileUpsertData['subscription_status'] {
  switch (stage) {
    case 1: return 'trialing';
    case 2: return 'active';      // Subscribing
    case 3: return 'canceled';    // Canceling
    case 4: return 'canceled';    // Expired
    case 5: return 'canceled';    // Canceled
    case 6: return 'past_due';    // PastDue
    default: return 'active';
  }
}

/**
 * Map Outseta Plan name to your subscription_tier
 */
function mapPlanToTier(planName?: string): ProfileUpsertData['subscription_tier'] {
  if (!planName) return 'free';
  
  const normalized = planName.toLowerCase();
  if (normalized.includes('agency')) return 'agency';
  if (normalized.includes('elite')) return 'elite';
  if (normalized.includes('pro')) return 'pro';
  return 'free'; // Starter maps to free
}

/**
 * Map Outseta webhook payload to your exact profiles table schema
 */
function mapOutsetaToProfile(payload: OutsetaWebhookPayload): ProfileUpsertData {
  // Handle Account-centric payloads (most webhook events)
  if (isAccountPayload(payload)) {
    const account = payload as OutsetaAccount;
    
    // Find primary person
    const personAccount = account.PersonAccount?.find(pa => pa.IsPrimary) 
      || account.PersonAccount?.[0];
    const person = personAccount?.Person;
    
    if (!person?.Email) {
      throw new Error('No person with email found in account payload');
    }
    
    // Get current subscription
    const subscription = account.CurrentSubscription || account.LatestSubscription;
    const plan = subscription?.Plan;
    
    const email = person.Email.toLowerCase().trim();
    
    return {
      // Outseta IDs
      outseta_person_uid: person.Uid,
      outseta_account_id: account.Uid,
      
      // User identity
      user_email: email,
      email: email,
      first_name: person.FirstName || null,
      last_name: person.LastName || null,
      full_name: person.FullName || null,
      display_name: person.FullName || `${person.FirstName || ''} ${person.LastName || ''}`.trim() || null,
      phone: person.PhoneMobile || person.PhoneWork || null,
      
      // Subscription
      subscription_tier: mapPlanToTier(plan?.Name),
      subscription_status: mapAccountStageToStatus(account.AccountStage),
      subscription_start_date: subscription?.StartDate || null,
      subscription_end_date: subscription?.EndDate || null,
      plan_uid: plan?.Uid || null,
      plan_name: plan?.Name || null,
      billing_renewal_term: subscription?.BillingRenewalTerm || null,
      
      // Timestamps
      outseta_created_at: person.Created || null,
      outseta_updated_at: person.Updated || new Date().toISOString(),
      
      // Full payload
      outseta_data: payload,
      
      // Activity
      last_login_at: person.LastLoginDateTime || null,
      last_active_at: new Date().toISOString(),
    };
  }
  
  // Handle Person-only payloads
  const person = payload as OutsetaPerson;
  
  if (!person.Email) {
    throw new Error('No email in person payload');
  }
  
  const email = person.Email.toLowerCase().trim();
  
  return {
    outseta_person_uid: person.Uid,
    outseta_account_id: null,
    user_email: email,
    email: email,
    first_name: person.FirstName || null,
    last_name: person.LastName || null,
    full_name: person.FullName || null,
    display_name: person.FullName || `${person.FirstName || ''} ${person.LastName || ''}`.trim() || null,
    phone: person.PhoneMobile || person.PhoneWork || null,
    subscription_tier: 'free',
    subscription_status: 'active',
    subscription_start_date: null,
    subscription_end_date: null,
    plan_uid: null,
    plan_name: null,
    billing_renewal_term: null,
    outseta_created_at: person.Created || null,
    outseta_updated_at: person.Updated || new Date().toISOString(),
    outseta_data: payload,
    last_login_at: person.LastLoginDateTime || null,
    last_active_at: new Date().toISOString(),
  };
}

// =================================================================
// ROUTE HANDLERS
// =================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID().slice(0, 8);
  
  console.log(`[${requestId}] Outseta webhook received`);
  
  try {
    const bodyText = await request.text();
    
    // Verify signature if configured
    const webhookSecret = process.env.OUTSETA_WEBHOOK_SECRET;
    const signature = request.headers.get('x-hub-signature-256') || '';
    
    if (webhookSecret) {
      if (!verifyOutsetaSignature(signature, bodyText, webhookSecret)) {
        console.error(`[${requestId}] Signature verification failed`);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    
    // Parse payload
    const payload: OutsetaWebhookPayload = JSON.parse(bodyText);
    const payloadType = isAccountPayload(payload) ? 'Account' : 'Person';
    console.log(`[${requestId}] Payload type: ${payloadType}`);
    
    // Map to profile
    const profileData = mapOutsetaToProfile(payload);
    console.log(`[${requestId}] Processing: ${profileData.email} (${profileData.subscription_tier})`);
    
    const supabase = getSupabaseAdmin();
    
    // Check if profile exists by email (your primary key)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, user_email')
      .eq('user_email', profileData.user_email)
      .single();
    
    let result;
    
    if (existing) {
      // UPDATE existing profile
      const { data, error } = await supabase
        .from('profiles')
        .update({
          outseta_person_uid: profileData.outseta_person_uid,
          outseta_account_id: profileData.outseta_account_id,
          email: profileData.email,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          full_name: profileData.full_name,
          display_name: profileData.display_name,
          phone: profileData.phone,
          subscription_tier: profileData.subscription_tier,
          subscription_status: profileData.subscription_status,
          subscription_start_date: profileData.subscription_start_date,
          subscription_end_date: profileData.subscription_end_date,
          plan_uid: profileData.plan_uid,
          plan_name: profileData.plan_name,
          billing_renewal_term: profileData.billing_renewal_term,
          outseta_created_at: profileData.outseta_created_at,
          outseta_updated_at: profileData.outseta_updated_at,
          outseta_data: profileData.outseta_data,
          last_login_at: profileData.last_login_at,
          last_active_at: profileData.last_active_at,
        })
        .eq('user_email', profileData.user_email)
        .select('id, user_email, subscription_tier, plan_name')
        .single();
      
      if (error) throw error;
      result = { operation: 'update', data };
    } else {
      // INSERT new profile
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select('id, user_email, subscription_tier, plan_name')
        .single();
      
      if (error) throw error;
      result = { operation: 'insert', data };
    }
    
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ${result.operation.toUpperCase()} complete in ${duration}ms: ${result.data?.user_email}`);
    
    return NextResponse.json({
      success: true,
      ...result,
      requestId,
      duration: `${duration}ms`
    });
    
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    return NextResponse.json(
      { error: 'Processing failed', details: (error as Error).message, requestId },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'Nested Objects - Outseta Webhook',
    timestamp: new Date().toISOString()
  });
}
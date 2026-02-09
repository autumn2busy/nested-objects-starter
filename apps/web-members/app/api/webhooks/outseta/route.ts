// =================================================================
// /app/api/webhooks/outseta/route.ts
// Receives webhooks from Outseta and syncs to Supabase profiles
// Handles BOTH Person-centric and Account-centric webhook payloads
// =================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { verifyOutsetaSignature } from '@/lib/security';
import { requireEnv, requireEnvInProduction } from '@/lib/env';

// =================================================================
// TYPES
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
  // Person payloads include PersonAccount array
  PersonAccount?: OutsetaPersonAccount[];
}

interface OutsetaPlan {
  Uid: string;
  Name: string;
  MonthlyRate?: number;
  AnnualRate?: number;
}

interface OutsetaSubscription {
  Uid: string;
  BillingRenewalTerm?: number;
  Plan?: OutsetaPlan;
  StartDate?: string;
  EndDate?: string;
  RenewalDate?: string;
}

interface OutsetaAccount {
  Uid: string;
  Name?: string;
  AccountStage?: number;
  AccountStageLabel?: string;
  CurrentSubscription?: OutsetaSubscription;
  LatestSubscription?: OutsetaSubscription;
  Created?: string;
  Updated?: string;
}

interface OutsetaPersonAccount {
  Uid: string;
  Person?: OutsetaPerson;
  Account?: OutsetaAccount;
  IsPrimary: boolean;
  Created?: string;
  Updated?: string;
}

// Account-centric payload (e.g., Subscription Started)
interface OutsetaAccountPayload extends OutsetaAccount {
  PersonAccount?: OutsetaPersonAccount[];
}

// The webhook can send either type
type OutsetaWebhookPayload = OutsetaPerson | OutsetaAccountPayload;

interface ProfileUpdateData {
  outseta_person_uid: string;
  outseta_account_id: string | null;
  user_email: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  display_name: string | null;
  phone: string | null;
  subscription_tier: 'free' | 'pro' | 'elite' | 'agency';
  subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  plan_uid: string | null;
  plan_name: string | null;
  billing_renewal_term: number | null;
  outseta_created_at: string | null;
  outseta_updated_at: string | null;
  outseta_data: object;
  last_login_at: string | null;
  last_active_at: string;
}

// =================================================================
// HELPERS
// =================================================================

function getSupabaseAdmin(): SupabaseClient {
  const url = requireEnv('SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * Determine if this is a Person-centric or Account-centric payload
 * Person payloads have Email at root level
 * Account payloads have Name at root level and PersonAccount contains Person objects
 */
function isPersonPayload(payload: OutsetaWebhookPayload): payload is OutsetaPerson {
  return 'Email' in payload && typeof payload.Email === 'string';
}

function mapAccountStageToStatus(stage?: number): ProfileUpdateData['subscription_status'] {
  switch (stage) {
    case 1: return 'trialing';
    case 2: return 'active';
    case 3: return 'canceled';
    case 4: return 'canceled';
    case 5: return 'canceled';
    case 6: return 'past_due';
    default: return 'active';
  }
}

function mapPlanToTier(planName?: string): ProfileUpdateData['subscription_tier'] {
  if (!planName) return 'free';
  const normalized = planName.toLowerCase();
  if (normalized.includes('agency')) return 'agency';
  if (normalized.includes('elite')) return 'elite';
  if (normalized.includes('pro')) return 'pro';
  return 'free';
}

/**
 * Extract profile data from webhook payload
 * Handles both Person Updated and Account/Subscription events
 */
function mapOutsetaToProfile(payload: OutsetaWebhookPayload): ProfileUpdateData {

  // =====================================================
  // PERSON-CENTRIC PAYLOAD (Person Created/Updated)
  // The Person is at root, Account info is nested inside PersonAccount
  // =====================================================
  if (isPersonPayload(payload)) {
    const person = payload;
    const email = person.Email.toLowerCase().trim();

    // Get account info from PersonAccount array if available
    const primaryPersonAccount = person.PersonAccount?.find(pa => pa.IsPrimary)
      || person.PersonAccount?.[0];
    const account = primaryPersonAccount?.Account;

    // For Person events, we may not have full subscription info
    // We'll update what we can
    const subscription = account?.CurrentSubscription || account?.LatestSubscription;
    const plan = subscription?.Plan;

    return {
      outseta_person_uid: person.Uid,
      outseta_account_id: account?.Uid || null,
      user_email: email,
      email: email,
      first_name: person.FirstName || null,
      last_name: person.LastName || null,
      full_name: person.FullName || null,
      display_name: person.FullName || `${person.FirstName || ''} ${person.LastName || ''}`.trim() || null,
      phone: person.PhoneMobile || person.PhoneWork || null,
      subscription_tier: mapPlanToTier(plan?.Name),
      subscription_status: mapAccountStageToStatus(account?.AccountStage),
      subscription_start_date: subscription?.StartDate || null,
      subscription_end_date: subscription?.EndDate || null,
      plan_uid: plan?.Uid || null,
      plan_name: plan?.Name || null,
      billing_renewal_term: subscription?.BillingRenewalTerm || null,
      outseta_created_at: person.Created || null,
      outseta_updated_at: person.Updated || new Date().toISOString(),
      outseta_data: payload,
      last_login_at: person.LastLoginDateTime || null,
      last_active_at: new Date().toISOString(),
    };
  }

  // =====================================================
  // ACCOUNT-CENTRIC PAYLOAD (Subscription Started/Updated/Cancelled)
  // The Account is at root, Person info is nested inside PersonAccount
  // =====================================================
  const account = payload as OutsetaAccountPayload;

  // Find primary person from PersonAccount array
  const primaryPersonAccount = account.PersonAccount?.find(pa => pa.IsPrimary)
    || account.PersonAccount?.[0];
  const person = primaryPersonAccount?.Person;

  if (!person?.Email) {
    throw new Error(`No person email in account payload. Account UID: ${account.Uid}`);
  }

  const email = person.Email.toLowerCase().trim();
  const subscription = account.CurrentSubscription || account.LatestSubscription;
  const plan = subscription?.Plan;

  return {
    outseta_person_uid: person.Uid,
    outseta_account_id: account.Uid,
    user_email: email,
    email: email,
    first_name: person.FirstName || null,
    last_name: person.LastName || null,
    full_name: person.FullName || null,
    display_name: person.FullName || `${person.FirstName || ''} ${person.LastName || ''}`.trim() || null,
    phone: person.PhoneMobile || person.PhoneWork || null,
    subscription_tier: mapPlanToTier(plan?.Name),
    subscription_status: mapAccountStageToStatus(account.AccountStage),
    subscription_start_date: subscription?.StartDate || null,
    subscription_end_date: subscription?.EndDate || null,
    plan_uid: plan?.Uid || null,
    plan_name: plan?.Name || null,
    billing_renewal_term: subscription?.BillingRenewalTerm || null,
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

    // Verify signature
    let webhookSecret: string | undefined;
    try {
      webhookSecret = requireEnvInProduction('OUTSETA_WEBHOOK_SECRET');
    } catch (error) {
      console.error(`[${requestId}] Configuration error: OUTSETA_WEBHOOK_SECRET missing in production`, error);
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const signature = request.headers.get('x-hub-signature-256') || '';

    // If secret is present, verify it. If missing (non-prod), warn.
    if (webhookSecret) {
      if (!verifyOutsetaSignature(signature, bodyText, webhookSecret)) {
        console.error(`[${requestId}] Signature verification failed`);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.warn(`[${requestId}] WARNING: Webhook secret not configured. Skipping signature verification.`);
    }

    // Parse payload
    const payload: OutsetaWebhookPayload = JSON.parse(bodyText);
    const payloadType = isPersonPayload(payload) ? 'Person' : 'Account';
    console.log(`[${requestId}] Payload type: ${payloadType}`);

    // Map to profile data
    const profileData = mapOutsetaToProfile(payload);
    console.log(`[${requestId}] Processing: ${profileData.email} | Person UID: ${profileData.outseta_person_uid}`);

    const supabase = getSupabaseAdmin();

    // Check if profile exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, user_email, outseta_updated_at')
      .eq('user_email', profileData.user_email)
      .single();

    let result;

    if (existing) {
      // IDEMPOTENCY CHECK
      // If we have already processed a newer or equal update, skip this one
      if (existing.outseta_updated_at && profileData.outseta_updated_at) {
        const existingTime = new Date(existing.outseta_updated_at).getTime();
        const incomingTime = new Date(profileData.outseta_updated_at).getTime();

        if (existingTime >= incomingTime) {
          console.log(`[${requestId}] Skipping update: Profile already verified up to ${existing.outseta_updated_at}`);
          return NextResponse.json({
            success: true,
            operation: 'skipped',
            reason: 'newer_version_exists',
            requestId,
            duration: `${Date.now() - startTime}ms`
          });
        }
      }

      // UPDATE - only update fields we have data for
      // UPDATE - only update fields we have data for
      const updatePayload: Record<string, unknown> = {
        outseta_person_uid: profileData.outseta_person_uid,
        email: profileData.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        full_name: profileData.full_name,
        display_name: profileData.display_name,
        phone: profileData.phone,
        outseta_updated_at: profileData.outseta_updated_at,
        outseta_data: profileData.outseta_data,
        last_active_at: profileData.last_active_at,
      };

      // Only update these if we have values (don't overwrite with nulls)
      if (profileData.outseta_account_id) updatePayload.outseta_account_id = profileData.outseta_account_id;
      if (profileData.plan_uid) updatePayload.plan_uid = profileData.plan_uid;
      if (profileData.plan_name) updatePayload.plan_name = profileData.plan_name;
      if (profileData.subscription_start_date) updatePayload.subscription_start_date = profileData.subscription_start_date;
      if (profileData.billing_renewal_term) updatePayload.billing_renewal_term = profileData.billing_renewal_term;
      if (profileData.last_login_at) updatePayload.last_login_at = profileData.last_login_at;

      // Only update subscription info if we got it from an Account event
      if (payloadType === 'Account' || profileData.plan_name) {
        updatePayload.subscription_tier = profileData.subscription_tier;
        updatePayload.subscription_status = profileData.subscription_status;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('user_email', profileData.user_email)
        .select('id, user_email, outseta_person_uid, subscription_tier, plan_name')
        .single();

      if (error) throw error;
      result = { operation: 'update', data };

    } else {
      // INSERT new profile
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select('id, user_email, outseta_person_uid, subscription_tier, plan_name')
        .single();

      if (error) throw error;
      result = { operation: 'insert', data };
    }

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ${result.operation.toUpperCase()} complete in ${duration}ms`);

    return NextResponse.json({
      success: true,
      ...result,
      requestId,
      duration: `${duration}ms`
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] Error after ${duration}ms:`, error);
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

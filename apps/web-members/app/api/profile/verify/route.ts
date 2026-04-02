import { NextResponse } from 'next/server';
import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server';
import { createServiceRoleClient } from '@/lib/supabase-admin';
import { calculateTrustScore } from '@/lib/trust-score';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const outsetaId = getOutsetaUserId(user);

    if (!user || !outsetaId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, value } = await req.json();

    if (!type || !value) {
      return NextResponse.json({ error: 'Missing type or value' }, { status: 400 });
    }

    if (type !== 'phone' && type !== 'identity') {
      return NextResponse.json({ error: 'Invalid verification type' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Step 1: Resolve the profile by outseta_person_uid, user_id, or email
    // This fixes the bug where .or() with string interpolation matched 0 rows
    let profile: { id: string; trust_score: number | null; trust_score_breakdown: Record<string, number> | null; background_check_status: string | null; training_modules_completed: number | null } | null = null;

    const { data: profileByUid } = await supabase
      .from('profiles')
      .select('id, trust_score, trust_score_breakdown, background_check_status, training_modules_completed')
      .or(`outseta_person_uid.eq.${outsetaId},user_id.eq.${outsetaId}`)
      .limit(1)
      .maybeSingle();

    if (profileByUid) {
      profile = profileByUid;
    } else if (user.email) {
      // Fallback: try email lookup
      const { data: profileByEmail } = await supabase
        .from('profiles')
        .select('id, trust_score, trust_score_breakdown, background_check_status, training_modules_completed')
        .eq('email', user.email)
        .maybeSingle();
      profile = profileByEmail;
    }

    if (!profile) {
      console.error(`[VERIFY_API_ERROR] No profile found for outsetaId=${outsetaId}, email=${user.email}`);
      return NextResponse.json({ error: 'Profile not found. Please contact support.' }, { status: 404 });
    }

    // Step 2: Set the correct updates based on type
    const updateField = type === 'phone' ? 'phone_verified' : 'identity_verified';
    
    // Step 3: Recalculate trust score with the new verification included
    // Create an updated profile object for the calculation
    const profileToCalculate = {
      ...profile,
      [updateField]: true,
    }

    const { total: newTotal, tier: newTier, breakdown: finalBreakdown } = calculateTrustScore(profileToCalculate, profile.training_modules_completed || 0)

    // Preserve history array if exists, and append verification action
    const existingBreakdown = (profile.trust_score_breakdown || {}) as Record<string, any>;
    if (!Array.isArray(existingBreakdown.history)) {
      existingBreakdown.history = [];
    }
    const finalBreakdownWithHistory = {
      ...finalBreakdown,
      history: [
        ...existingBreakdown.history,
        {
          action: type === 'phone' ? 'phone_verification' : 'identity_verification',
          points: type === 'phone' ? 5 : 15,
          timestamp: new Date().toISOString()
        }
      ]
    }

    const updatePayload: any = {
      [updateField]: true,
      trust_score: newTotal,
      trust_tier: newTier,
      trust_score_breakdown: finalBreakdownWithHistory,
      updated_at: new Date().toISOString()
    };

    if (type === 'phone') {
      updatePayload.phone = value;
    }
    // We don't save identity_proof_id because it's not in the DB schema

    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', profile.id)
      .select('id')
      .single();

    if (profileError || !updatedProfile) {
      console.error('[VERIFY_API_ERROR]', profileError);
      return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 });
    }

    // LOGGING for Admin Audit
    console.log(`[MANUAL_VERIFICATION] User ${outsetaId} (profile ${profile.id}) verified ${type} with value: ${value}. Trust score: ${newTotal} (${newTier})`);

    return NextResponse.json({ 
      success: true, 
      message: `Your ${type} has been verified! Your Trust Score has been updated.`,
      trustScore: newTotal,
      trustTier: newTier,
      trustScoreBreakdown: finalBreakdownWithHistory,
    });
  } catch (err) {
    console.error('[VERIFY_API_UNEXPECTED_ERROR]', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server';
import { createServiceRoleClient } from '@/lib/supabase-admin';

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

    // In a real automated system, we'd verify the value here (e.g. SMS code or ID lookup).
    // For this implementation, we will mark it as verified and log the request for admin review.
    
    const updateField = type === 'phone' ? 'phone_verified' : 'identity_verified';
    const metadataField = type === 'phone' ? 'phone_number' : 'identity_proof_id';

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        [updateField]: true,
        [metadataField]: value,
        updated_at: new Date().toISOString()
      })
      .or(`outseta_person_uid.eq.${outsetaId},user_id.eq.${outsetaId}`);

    if (profileError) {
      console.error('[VERIFY_API_ERROR]', profileError);
      return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 });
    }

    // LOGGING for Admin Audit
    console.log(`[MANUAL_VERIFICATION] User ${outsetaId} verified ${type} with value: ${value}`);

    return NextResponse.json({ 
      success: true, 
      message: `Your ${type} has been submitted and marked as verified! Our team will review the details shortly.` 
    });
  } catch (err) {
    console.error('[VERIFY_API_UNEXPECTED_ERROR]', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

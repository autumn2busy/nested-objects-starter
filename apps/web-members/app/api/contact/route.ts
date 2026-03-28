import { NextResponse } from 'next/server';
import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server';
import { createServiceRoleClient } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const outsetaId = getOutsetaUserId(user);
    const body = await req.json();
    const { name, email, topic, message } = body;

    if (!name || !email || !topic || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // 1. Resolve Profile (for internal auditing)
    let profileId = null;
    if (outsetaId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .or(`outseta_person_uid.eq.${outsetaId},user_id.eq.${outsetaId}`)
        .maybeSingle();
      profileId = profile?.id;
    }

    // 2. Log to Supabase
    const { error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        user_id: user?.Id || user?.id || null,
        profile_id: profileId,
        name,
        email,
        topic,
        message,
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('[CONTACT_DB_LOG_ERROR]', dbError);
      // We continue even if DB logging fails, to avoid blocking the user message
    }

    // 3. Send Email Notification
    // Using a internal fetch to trigger an email workflow (e.g. n8n or direct service)
    const n8nUrl = process.env.N8N_AI_CONCIERGE_WEBHOOK_URL; // Using concierge webhook as a proxy or dedicated one
    
    if (n8nUrl) {
       fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'contact_form',
          target_email: 'support@nestedobjects.com',
          submission: { name, email, topic, message, profileId, outsetaId }
        })
      }).catch(err => console.error('[CONTACT_EMAIL_WEBHOOK_ERROR]', err));
    }

    // LOGGING for audit
    console.log('[CONTACT_FORM_SUBMISSION_SUCCESS]', { name, email, topic });

    return NextResponse.json({ 
      success: true, 
      message: "Thank you for reaching out! We've received your message and will get back to you within one business day." 
    });
  } catch (err) {
    console.error('[CONTACT_API_ERROR]', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

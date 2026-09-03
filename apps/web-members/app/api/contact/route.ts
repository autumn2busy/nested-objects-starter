import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server';
import {
  isRateLimitExceededError,
  isRateLimitUnavailableError,
  rateLimit,
} from '@/lib/rate-limit';
import { createServiceRoleClient } from '@/lib/supabase-server';

const MAX_REQUEST_LENGTH = 8_192;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 5_000;
const NOTIFICATION_TIMEOUT_MS = 5_000;
const ALLOWED_TOPICS = new Set([
  'Plan comparison',
  'Billing question',
  'Partnership opportunity',
  'Training or resources',
  'Something else',
]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const limiter = rateLimit({ limit: 5, intervalMs: 60_000 });

type ContactSubmission = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

type NotificationState = 'webhook_accepted' | 'not_configured' | 'failed';

function failure(status: number, error: string, retryAfter?: string) {
  return NextResponse.json(
    { success: false, stored: false, notification: 'not_attempted', error },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        ...(retryAfter ? { 'Retry-After': retryAfter } : {}),
      },
    }
  );
}

function rateLimitKey(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = forwardedFor || req.headers.get('x-real-ip') || 'unknown';
  return `contact:${createHash('sha256').update(address).digest('hex').slice(0, 24)}`;
}

async function readSubmission(req: Request): Promise<
  | { submission: ContactSubmission }
  | { response: ReturnType<typeof failure> }
> {
  const contentLength = Number(req.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_LENGTH) {
    return { response: failure(413, 'Message is too large. Please shorten it and try again.') };
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return { response: failure(400, 'Invalid request.') };
  }

  if (rawBody.length > MAX_REQUEST_LENGTH) {
    return { response: failure(413, 'Message is too large. Please shorten it and try again.') };
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return { response: failure(400, 'Invalid request.') };
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { response: failure(400, 'Invalid request.') };
  }

  const record = body as Record<string, unknown>;
  if (
    typeof record.name !== 'string' ||
    typeof record.email !== 'string' ||
    typeof record.topic !== 'string' ||
    typeof record.message !== 'string'
  ) {
    return { response: failure(400, 'Invalid request.') };
  }

  const submission = {
    name: record.name.trim(),
    email: record.email.trim(),
    topic: record.topic.trim(),
    message: record.message.trim(),
  };

  if (
    !submission.name ||
    submission.name.length > MAX_NAME_LENGTH ||
    !submission.email ||
    submission.email.length > MAX_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(submission.email) ||
    !ALLOWED_TOPICS.has(submission.topic) ||
    !submission.message ||
    submission.message.length > MAX_MESSAGE_LENGTH
  ) {
    return { response: failure(400, 'Please check the form fields and try again.') };
  }

  return { submission };
}

async function notifySupport(
  webhookUrl: string | undefined,
  submission: ContactSubmission
): Promise<NotificationState> {
  if (!webhookUrl) return 'not_configured';

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'contact_form',
        target_email: 'support@nestedobjects.com',
        submission,
      }),
      signal: AbortSignal.timeout(NOTIFICATION_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error('[CONTACT_NOTIFICATION_FAILED]', { status: response.status });
      return 'failed';
    }

    return 'webhook_accepted';
  } catch (error) {
    const errorName = error && typeof error === 'object' && 'name' in error
      ? String(error.name)
      : '';
    const reason = errorName === 'AbortError' || errorName === 'TimeoutError'
      ? 'timeout'
      : 'request_error';
    console.error('[CONTACT_NOTIFICATION_FAILED]', { reason });
    return 'failed';
  }
}

export async function POST(req: Request) {
  try {
    await limiter.check(rateLimitKey(req));
  } catch (error) {
    if (isRateLimitExceededError(error)) {
      return failure(429, 'Too many messages. Please wait and try again.', '60');
    }
    if (isRateLimitUnavailableError(error)) {
      return failure(503, 'Message protection is temporarily unavailable. Please try again.', '30');
    }

    console.error('[CONTACT_RATE_LIMIT_FAILED]');
    return failure(503, 'Message protection is temporarily unavailable. Please try again.', '30');
  }

  const parsed = await readSubmission(req);
  if ('response' in parsed) return parsed.response;

  const { submission } = parsed;
  const user = await getCurrentUser();
  const outsetaId = getOutsetaUserId(user);

  let supabase: ReturnType<typeof createServiceRoleClient>;
  try {
    supabase = createServiceRoleClient();
  } catch {
    console.error('[CONTACT_DB_WRITE_FAILED]');
    return failure(503, 'We could not receive your message. Please try again.');
  }

  let profileId: string | null = null;
  if (outsetaId) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('outseta_person_uid', outsetaId)
        .maybeSingle();
      profileId = profile?.id ?? null;

      if (profileError) console.warn('[CONTACT_PROFILE_LOOKUP_FAILED]');
    } catch {
      console.warn('[CONTACT_PROFILE_LOOKUP_FAILED]');
    }
  }

  try {
    const { error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        // Outseta subjects are not Supabase auth.users UUIDs.
        user_id: null,
        profile_id: profileId,
        ...submission,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('[CONTACT_DB_WRITE_FAILED]');
      return failure(503, 'We could not receive your message. Please try again.');
    }
  } catch {
    console.error('[CONTACT_DB_WRITE_FAILED]');
    return failure(503, 'We could not receive your message. Please try again.');
  }

  const notification = await notifySupport(
    process.env.N8N_AI_CONCIERGE_WEBHOOK_URL,
    submission
  );

  return NextResponse.json(
    {
      success: true,
      stored: true,
      notification,
      message: 'Thank you for reaching out. Your message has been received.',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

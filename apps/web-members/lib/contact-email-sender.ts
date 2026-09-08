import 'server-only';
import { Buffer } from 'node:buffer';
import {
  createContactEmail,
  type ContactNotificationState,
  type ContactSubmission,
} from './contact-email-message';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const SEND_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
const NOTIFICATION_TIMEOUT_MS = 5_000;

type FailureReason = 'invalid_message' | 'token_rejected' | 'invalid_token' |
  'send_rejected' | 'invalid_send_response' | 'request_failed';

function failed(reason: FailureReason): ContactNotificationState {
  // Provider responses, exceptions, credentials, receipt IDs and submitted data
  // must never enter logs. These fixed labels are sufficient for health checks.
  console.warn('[CONTACT_NOTIFICATION]', { state: 'failed', reason });
  return 'failed';
}

function encodedSubject(subject: string): string {
  // Each RFC 2047 encoded word stays below 75 characters, without splitting a
  // UTF-8 code point. Long subjects are folded rather than injected as raw text.
  const chunks: string[] = [];
  let chunk = '';
  for (const character of subject) {
    if (Buffer.byteLength(chunk + character, 'utf8') > 45) {
      chunks.push(chunk);
      chunk = '';
    }
    chunk += character;
  }
  if (chunk) chunks.push(chunk);
  return chunks.map(value => `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`).join('\r\n ');
}

function rawMessage(submission: ContactSubmission, receiptId: string): string {
  const message = createContactEmail(submission, receiptId);
  const body = Buffer.from(message.text.replace(/\r\n|\r|\n/g, '\r\n'), 'utf8')
    .toString('base64').match(/.{1,76}/g)?.join('\r\n') ?? '';
  return Buffer.from([
    `From: ${message.from}`,
    `To: ${message.to}`,
    `Reply-To: ${message.replyTo}`,
    `Subject: ${encodedSubject(message.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${message.messageId}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    body,
    '',
  ].join('\r\n'), 'utf8').toString('base64url');
}

export async function notifyContact(
  submission: ContactSubmission,
  receiptId: string,
): Promise<ContactNotificationState> {
  // Local, Preview and unapproved Production are inert, including OAuth calls.
  if (process.env.CONTACT_EMAIL_ENABLED !== 'true' || process.env.VERCEL_ENV !== 'production') {
    return 'not_configured';
  }
  const clientId = process.env.CONTACT_GMAIL_CLIENT_ID?.trim();
  const clientSecret = process.env.CONTACT_GMAIL_CLIENT_SECRET?.trim();
  const refreshToken = process.env.CONTACT_GMAIL_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) return 'not_configured';

  let raw: string;
  try {
    raw = rawMessage(submission, receiptId);
  } catch {
    return failed('invalid_message');
  }

  try {
    // A single signal bounds token refresh, send and both response-body reads.
    // No automatic retries: an ambiguous send might already have been accepted.
    const signal = AbortSignal.timeout(NOTIFICATION_TIMEOUT_MS);
    const tokenResponse = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
      redirect: 'error',
      cache: 'no-store',
      signal,
    });
    if (!tokenResponse.ok) return failed('token_rejected');
    const token: unknown = await tokenResponse.json();
    signal.throwIfAborted();
    if (!token || typeof token !== 'object' ||
        !('access_token' in token) || typeof token.access_token !== 'string' ||
        token.access_token.length > 8_192 || !/^[A-Za-z0-9._~+/-]+=*$/.test(token.access_token) ||
        !('token_type' in token) || typeof token.token_type !== 'string' || token.token_type.toLowerCase() !== 'bearer' ||
        !('expires_in' in token) || typeof token.expires_in !== 'number' || !Number.isFinite(token.expires_in) || token.expires_in <= 0) {
      return failed('invalid_token');
    }

    const sendResponse = await fetch(SEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ raw }),
      redirect: 'error',
      cache: 'no-store',
      signal,
    });
    if (!sendResponse.ok) return failed('send_rejected');
    const sent: unknown = await sendResponse.json();
    signal.throwIfAborted();
    if (!sent || typeof sent !== 'object' || !('id' in sent) ||
        typeof sent.id !== 'string' || !/^[A-Za-z0-9_-]{1,256}$/.test(sent.id)) {
      return failed('invalid_send_response');
    }
    // Acceptance is not proof of mailbox delivery; only a live inbox check is.
    return 'provider_accepted';
  } catch {
    return failed('request_failed');
  }
}

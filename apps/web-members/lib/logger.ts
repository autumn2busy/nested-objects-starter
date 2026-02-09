type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogMetadata = Record<string, unknown>;

const PII_KEYS = new Set([
  'authorization',
  'cookie',
  'email',
  'first_name',
  'last_name',
  'name',
  'password',
  'phone',
  'ssn',
  'token',
  'user_email',
  'jwt',
]);

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}/g;
const JWT_REGEX = /[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g;
const BEARER_REGEX = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g;

export const REQUEST_ID_HEADER = 'x-request-id';

function redactString(value: string): string {
  return value
    .replace(BEARER_REGEX, 'Bearer [REDACTED]')
    .replace(JWT_REGEX, '[REDACTED_JWT]')
    .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
    .replace(PHONE_REGEX, '[REDACTED_PHONE]');
}

function redactValue(
  value: unknown,
  key: string | undefined,
  seen: WeakSet<object>
): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return redactString(value);
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return '[Circular]';
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, undefined, seen));
  }

  const result: Record<string, unknown> = {};
  for (const [childKey, childValue] of Object.entries(value)) {
    if (PII_KEYS.has(childKey.toLowerCase())) {
      result[childKey] = '[REDACTED]';
    } else {
      result[childKey] = redactValue(childValue, childKey, seen);
    }
  }
  return result;
}

function redactMetadata(metadata?: LogMetadata): LogMetadata | undefined {
  if (!metadata) return undefined;
  return redactValue(metadata, undefined, new WeakSet()) as LogMetadata;
}

function log(
  level: LogLevel,
  message: string,
  metadata: LogMetadata | undefined,
  context: { requestId?: string; source?: string }
) {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    requestId: context.requestId,
    source: context.source,
    ...redactMetadata(metadata),
  };

  const payload = JSON.stringify(entry);
  if (level === 'error') {
    console.error(payload);
  } else if (level === 'warn') {
    console.warn(payload);
  } else if (level === 'debug') {
    console.debug(payload);
  } else {
    console.log(payload);
  }
}

export function createLogger(context: { requestId?: string; source?: string } = {}) {
  return {
    debug: (message: string, metadata?: LogMetadata) => log('debug', message, metadata, context),
    info: (message: string, metadata?: LogMetadata) => log('info', message, metadata, context),
    warn: (message: string, metadata?: LogMetadata) => log('warn', message, metadata, context),
    error: (message: string, metadata?: LogMetadata) => log('error', message, metadata, context),
  };
}

export function getRequestId(headers: Headers | null | undefined): string {
  const existing = headers?.get?.(REQUEST_ID_HEADER);
  if (existing) return existing;

  return globalThis.crypto?.randomUUID?.() ?? `req_${Math.random().toString(36).slice(2, 10)}`;
}

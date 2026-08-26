import { PREVIEW_INPUT_LIMITS, PreviewRequestValidationError } from './preview-contract.js'

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store, max-age=0',
  'x-content-type-options': 'nosniff',
} as const

export function jsonResponse(body: unknown, status = 200, additionalHeaders: HeadersInit = {}): Response {
  const headers = new Headers(JSON_HEADERS)
  new Headers(additionalHeaders).forEach((value, key) => headers.set(key, value))
  return Response.json(body, { status, headers })
}

export function methodNotAllowed(allowedMethods: string[]): Response {
  return jsonResponse(
    { ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' } },
    405,
    { allow: allowedMethods.join(', ') },
  )
}

export async function readBoundedJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.includes('application/json')) {
    throw new PreviewRequestValidationError(
      'Preview evaluation requires an application/json request body',
      [{ path: 'headers.content-type', message: 'Use application/json.' }],
    )
  }

  const declaredLength = Number.parseInt(request.headers.get('content-length') ?? '', 10)
  if (Number.isFinite(declaredLength) && declaredLength > PREVIEW_INPUT_LIMITS.requestBytes) {
    throw new PreviewPayloadTooLargeError(PREVIEW_INPUT_LIMITS.requestBytes)
  }

  const text = await request.text()
  if (new TextEncoder().encode(text).byteLength > PREVIEW_INPUT_LIMITS.requestBytes) {
    throw new PreviewPayloadTooLargeError(PREVIEW_INPUT_LIMITS.requestBytes)
  }
  if (!text.trim()) {
    throw new PreviewRequestValidationError(
      'Preview evaluation request body is empty',
      [{ path: 'body', message: 'Provide a JSON object.' }],
    )
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new PreviewRequestValidationError(
      'Preview evaluation request body contains invalid JSON',
      [{ path: 'body', message: 'Correct the JSON syntax.' }],
    )
  }
}

export class PreviewPayloadTooLargeError extends Error {
  readonly code = 'PREVIEW_PAYLOAD_TOO_LARGE'
  readonly maximumBytes: number

  constructor(maximumBytes: number) {
    super(`Preview request exceeds the ${maximumBytes}-byte limit`)
    this.name = 'PreviewPayloadTooLargeError'
    this.maximumBytes = maximumBytes
  }
}

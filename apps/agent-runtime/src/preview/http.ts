export const PREVIEW_REQUEST_BODY_LIMIT_BYTES = 256 * 1024

export class PreviewHttpError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, unknown>

  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'PreviewHttpError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'cache-control': 'no-store, max-age=0',
      'content-type': 'application/json; charset=utf-8',
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff',
      ...headers,
    },
  })
}

export function methodNotAllowed(allowed: string[]): Response {
  return jsonResponse(
    {
      ok: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Allowed methods: ${allowed.join(', ')}`,
      },
    },
    405,
    { allow: allowed.join(', ') },
  )
}

export async function parseJsonBody(
  request: Request,
  maximumBytes = PREVIEW_REQUEST_BODY_LIMIT_BYTES,
): Promise<unknown> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.startsWith('application/json')) {
    throw new PreviewHttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.')
  }

  const contentLength = request.headers.get('content-length')
  if (contentLength) {
    const declaredBytes = Number.parseInt(contentLength, 10)
    if (Number.isFinite(declaredBytes) && declaredBytes > maximumBytes) {
      throw new PreviewHttpError(413, 'REQUEST_TOO_LARGE', `Request body exceeds ${maximumBytes} bytes.`)
    }
  }

  const source = await request.text()
  const actualBytes = new TextEncoder().encode(source).byteLength
  if (actualBytes > maximumBytes) {
    throw new PreviewHttpError(413, 'REQUEST_TOO_LARGE', `Request body exceeds ${maximumBytes} bytes.`)
  }
  if (!source.trim()) {
    throw new PreviewHttpError(400, 'EMPTY_REQUEST_BODY', 'A JSON request body is required.')
  }

  try {
    return JSON.parse(source) as unknown
  } catch {
    throw new PreviewHttpError(400, 'INVALID_JSON', 'Request body is not valid JSON.')
  }
}

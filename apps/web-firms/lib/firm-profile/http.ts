import { FirmProfileError } from './contracts'
export async function readBoundedJson(request: Request, maxBytes = 20000): Promise<unknown> {
  const length = request.headers.get('content-length')
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) throw new FirmProfileError(413,'Company profile is too large.')
  if (!request.body) throw new FirmProfileError(400,'Invalid profile request.')
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const {done,value} = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) { await reader.cancel(); throw new FirmProfileError(413,'Company profile is too large.') }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength }
  try { return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)) } catch { throw new FirmProfileError(400,'Invalid profile request.') }
}

import { createHash } from 'node:crypto'

import { ContractValidationError } from './contracts.js'

export function stableUuid(namespace: string, value: string): string {
  const normalizedNamespace = namespace.trim()
  const normalizedValue = value.trim()
  if (!normalizedNamespace || !normalizedValue) {
    throw new ContractValidationError('stableUuid requires a namespace and value')
  }

  const bytes = createHash('sha256')
    .update(normalizedNamespace)
    .update('\0')
    .update(normalizedValue)
    .digest()
    .subarray(0, 16) as Buffer

  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

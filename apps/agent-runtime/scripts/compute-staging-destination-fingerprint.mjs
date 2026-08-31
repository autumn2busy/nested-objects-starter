import { createHash } from 'node:crypto'
import process from 'node:process'

const policyVersion = 'phase-c3-v1'
const projectRef = String(process.argv[2] ?? '').trim().toLowerCase()

if (!/^[a-z0-9]{15,30}$/.test(projectRef)) {
  console.error('Usage: node scripts/compute-staging-destination-fingerprint.mjs <reviewed-staging-project-ref>')
  process.exitCode = 1
} else {
  const hostname = `${projectRef}.supabase.co`
  const fingerprint = createHash('sha256')
    .update([policyVersion, projectRef, hostname].join('\n'))
    .digest('hex')

  console.log(JSON.stringify({ policyVersion, projectRef, hostname, fingerprint }, null, 2))
}

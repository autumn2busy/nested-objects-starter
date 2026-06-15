import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicDir = path.resolve(__dirname, '..', 'public')
const rasterExtensions = new Set(['.jpg', '.jpeg', '.png'])
const optimizedExtensions = ['.avif', '.webp']
const sizeLimit = 150 * 1024
const shouldFail = process.argv.includes('--fail-on-missing')

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(fullPath) : [fullPath]
  })
}

function formatKb(bytes) {
  return `${Math.round(bytes / 1024)} KB`
}

const files = walk(publicDir)
const candidates = files
  .filter((file) => rasterExtensions.has(path.extname(file).toLowerCase()))
  .map((file) => {
    const stat = fs.statSync(file)
    const parsed = path.parse(file)
    const companions = optimizedExtensions.filter((ext) => fs.existsSync(path.join(parsed.dir, `${parsed.name}${ext}`)))
    return {
      file,
      relativePath: `/${path.relative(publicDir, file).replace(/\\/g, '/')}`,
      size: stat.size,
      companions,
    }
  })
  .filter((item) => item.size >= sizeLimit)
  .sort((a, b) => b.size - a.size)

const missingCompanions = candidates.filter((item) => item.companions.length === 0)
const largeImages = candidates

console.log(`Public image audit`)
console.log(`Large raster files: ${largeImages.length}`)
console.log(`Large raster files missing AVIF/WebP companions: ${missingCompanions.length}`)

for (const item of largeImages.slice(0, 50)) {
  const status = item.companions.length > 0 ? `optimized: ${item.companions.join(', ')}` : 'needs AVIF/WebP'
  console.log(`${formatKb(item.size).padStart(8)}  ${item.relativePath}  ${status}`)
}

if (shouldFail && missingCompanions.length > 0) {
  process.exitCode = 1
}

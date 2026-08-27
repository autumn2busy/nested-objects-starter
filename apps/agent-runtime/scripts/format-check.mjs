import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const extensions = new Set(['.ts', '.mjs', '.json', '.md', '.example'])
const ignored = new Set(['node_modules', 'dist', 'dist-api'])
const failures = []

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      await walk(absolute)
      continue
    }

    const extension = path.extname(entry.name)
    if (!extensions.has(extension) && entry.name !== '.env.example') continue

    const source = await readFile(absolute, 'utf8')
    const relative = path.relative(root, absolute)
    if (source.includes('\r\n')) failures.push(`${relative}: contains CRLF line endings`)
    if (!source.endsWith('\n')) failures.push(`${relative}: missing final newline`)

    source.split('\n').forEach((line, index) => {
      if (/\s+$/.test(line)) failures.push(`${relative}:${index + 1}: trailing whitespace`)
    })

    if (extension === '.json') {
      try {
        JSON.parse(source)
      } catch (error) {
        failures.push(`${relative}: invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }
}

await walk(root)

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log('Format check passed.')
}

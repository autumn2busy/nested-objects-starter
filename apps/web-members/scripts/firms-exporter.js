const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

/**
 * Minimal .env loader so we avoid pulling extra dependencies during ops scripts.
 * Later files in the array win, but existing process.env values are preserved.
 * @param {string} filePath
 */
function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return

    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split(/\r?\n/)

    for (const line of lines) {
        if (!line || line.trim().startsWith('#') || !line.includes('=')) continue
        const [rawKey, ...rest] = line.split('=')
        const key = rawKey.trim()
        const value = rest.join('=').trim().replace(/^['"]|['"]$/g, '')

        if (key && !(key in process.env)) {
            process.env[key] = value
        }
    }
}

const envCandidates = [
    path.resolve(__dirname, '../.env.local'),
    path.resolve(__dirname, '../../.env.local'),
    path.resolve(process.cwd(), '.env'),
]

envCandidates.forEach(loadEnvFile)

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function main() {
    console.log('Fetching firms...')

    // Fetch all rows. If > 1000, might need pagination, but let's assume < 1000 for now or user can request pagination.
    // Actually, Supabase defaults to 1000 limit suitable for this specific user request context likely.
    // Using explicit range for safety if needed, but simple select is a good start.

    const { data, error } = await supabase
        .from('firms')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching firms:', error)
        process.exit(1)
    }

    console.log(`Fetched ${data.length} firms.`)

    const outputPath = path.resolve(__dirname, '../firms_export.json')
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))
    console.log(`Exported to ${outputPath}`)
}

main().catch(console.error)

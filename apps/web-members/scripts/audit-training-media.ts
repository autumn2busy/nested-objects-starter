/**
 * audit-training-media.ts
 * 
 * READ-ONLY diagnostic script. Does NOT modify the database or filesystem.
 * 
 * Cross-references:
 *   1. training_resources.file_path  → files in public/training/
 *   2. training_lessons.content       → inline /training/ references in HTML/JSON
 *   3. Files on disk                  → database references
 * 
 * Run:
 *   npx tsx scripts/audit-training-media.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// ── Setup ──────────────────────────────────────────────
const env = dotenv.parse(fs.readFileSync('.env.local'))
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const PUBLIC_DIR = path.resolve(__dirname, '..', 'public')
const TRAINING_DIR = path.join(PUBLIC_DIR, 'training')

// ── Helpers ────────────────────────────────────────────

/** Recursively list all files under a directory, returning paths relative to PUBLIC_DIR */
function walkDir(dir: string): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkDir(full))
    } else {
      // Normalize to forward-slash /training/module-1/file.pdf
      const rel = '/' + path.relative(PUBLIC_DIR, full).replace(/\\/g, '/')
      results.push(rel)
    }
  }
  return results
}

/** Extract all /training/... paths from an HTML/JSON string */
function extractTrainingPaths(text: string): string[] {
  if (!text) return []
  const matches: string[] = []

  // Match src="/training/...", href="/training/...", url("/training/...")
  const regex = /(?:src|href|url)\s*=\s*["']?(\/training\/[^"'\s)>]+)/gi
  let m: RegExpExecArray | null
  while ((m = regex.exec(text)) !== null) {
    matches.push(decodeURIComponent(m[1]))
  }

  // Also catch bare /training/ paths in JSON strings like "file_url": "/training/..."
  const jsonRegex = /["'](\/training\/[^"']+)["']/g
  while ((m = jsonRegex.exec(text)) !== null) {
    if (!matches.includes(decodeURIComponent(m[1]))) {
      matches.push(decodeURIComponent(m[1]))
    }
  }

  return matches
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Main ───────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗')
  console.log('║   TRAINING MEDIA AUDIT — READ-ONLY DIAGNOSTIC      ║')
  console.log('╚══════════════════════════════════════════════════════╝\n')

  // 1. Get all files on disk
  console.log('📂 Scanning public/training/ ...')
  const diskFiles = walkDir(TRAINING_DIR)
  let totalSizeBytes = 0
  for (const f of diskFiles) {
    const fullPath = path.join(PUBLIC_DIR, f.replace(/^\//, ''))
    try { totalSizeBytes += fs.statSync(fullPath).size } catch { }
  }
  console.log(`   Found ${diskFiles.length} files (${formatBytes(totalSizeBytes)} total)\n`)

  // 2. Query training_resources table
  console.log('🗄️  Querying training_resources table ...')
  const { data: resources, error: resErr } = await supabase
    .from('training_resources')
    .select('id, module_id, title, file_path, file_type')

  if (resErr) {
    console.error('   ❌ Error querying training_resources:', resErr.message)
    return
  }
  console.log(`   Found ${resources?.length || 0} rows\n`)

  // 3. Query training_lessons table (for inline content refs)
  console.log('📝 Querying training_lessons.content for inline references ...')
  const { data: lessons, error: lesErr } = await supabase
    .from('training_lessons')
    .select('id, module_id, lesson_number, title, content, video_url')

  if (lesErr) {
    console.error('   ❌ Error querying training_lessons:', lesErr.message)
    return
  }
  console.log(`   Found ${lessons?.length || 0} lessons\n`)

  // Scan lesson content for /training/ references
  const inlineRefs: { lessonId: string; lessonTitle: string; moduleId: string; paths: string[] }[] = []
  for (const lesson of (lessons || [])) {
    const content = lesson.content || ''
    const paths = extractTrainingPaths(content)
    if (paths.length > 0) {
      inlineRefs.push({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        moduleId: lesson.module_id,
        paths
      })
    }
  }

  // Collect all DB-referenced paths
  const dbPaths = new Set<string>()
  for (const r of (resources || [])) {
    if (r.file_path) dbPaths.add(r.file_path)
  }
  for (const ref of inlineRefs) {
    for (const p of ref.paths) dbPaths.add(p)
  }

  const diskSet = new Set(diskFiles)

  // ── Report ─────────────────────────────────────────

  // A) DB references → file exists on disk?
  console.log('═══════════════════════════════════════════════════════')
  console.log('  SECTION A: Database references vs files on disk')
  console.log('═══════════════════════════════════════════════════════\n')

  const missingOnDisk: string[] = []
  const foundOnDisk: string[] = []
  for (const p of dbPaths) {
    if (diskSet.has(p)) {
      foundOnDisk.push(p)
    } else {
      missingOnDisk.push(p)
    }
  }

  console.log(`   ✅ ${foundOnDisk.length} DB paths have matching files on disk`)
  console.log(`   ❌ ${missingOnDisk.length} DB paths have NO matching file on disk\n`)

  if (missingOnDisk.length > 0) {
    console.log('   ⚠️  MISSING FILES (referenced in DB but not on disk):')
    for (const p of missingOnDisk) {
      console.log(`      • ${p}`)
    }
    console.log()
  }

  // B) Files on disk → referenced in DB?
  console.log('═══════════════════════════════════════════════════════')
  console.log('  SECTION B: Files on disk vs database references')
  console.log('═══════════════════════════════════════════════════════\n')

  const orphanedFiles: string[] = []
  const referencedFiles: string[] = []
  for (const f of diskFiles) {
    if (dbPaths.has(f)) {
      referencedFiles.push(f)
    } else {
      orphanedFiles.push(f)
    }
  }

  console.log(`   ✅ ${referencedFiles.length} files on disk are referenced in DB`)
  console.log(`   🔶 ${orphanedFiles.length} files on disk are NOT referenced anywhere\n`)

  if (orphanedFiles.length > 0) {
    console.log('   📦 ORPHANED FILES (on disk but no DB reference):')
    let orphanSize = 0
    for (const f of orphanedFiles) {
      const fullPath = path.join(PUBLIC_DIR, f.replace(/^\//, ''))
      let size = 0
      try { size = fs.statSync(fullPath).size } catch { }
      orphanSize += size
      console.log(`      • ${f}  (${formatBytes(size)})`)
    }
    console.log(`\n   📦 Orphaned files total: ${formatBytes(orphanSize)}`)
    console.log()
  }

  // C) Inline content references
  console.log('═══════════════════════════════════════════════════════')
  console.log('  SECTION C: Inline /training/ refs in lesson content')
  console.log('═══════════════════════════════════════════════════════\n')

  if (inlineRefs.length === 0) {
    console.log('   ✅ No inline /training/ references found in lesson content\n')
  } else {
    console.log(`   ⚠️  ${inlineRefs.length} lesson(s) contain inline /training/ references:\n`)
    for (const ref of inlineRefs) {
      console.log(`   Lesson: "${ref.lessonTitle}" (${ref.lessonId})`)
      for (const p of ref.paths) {
        const exists = diskSet.has(p) ? '✅' : '❌'
        console.log(`      ${exists} ${p}`)
      }
      console.log()
    }
  }

  // D) training_resources by module summary
  console.log('═══════════════════════════════════════════════════════')
  console.log('  SECTION D: training_resources breakdown by module')
  console.log('═══════════════════════════════════════════════════════\n')

  const byModule = new Map<string, typeof resources>()
  for (const r of (resources || [])) {
    const key = r.module_id
    if (!byModule.has(key)) byModule.set(key, [])
    byModule.get(key)!.push(r)
  }

  // Get module titles
  const { data: modules } = await supabase
    .from('training_modules')
    .select('id, module_number, title')
    .order('module_number')

  for (const mod of (modules || [])) {
    const modResources = byModule.get(mod.id) || []
    console.log(`   Module ${mod.module_number}: ${mod.title}  (${modResources.length} resources)`)
    for (const r of modResources) {
      const exists = r.file_path && diskSet.has(r.file_path) ? '✅' : '❌'
      console.log(`      ${exists} [${r.file_type}] ${r.title}`)
      console.log(`         path: ${r.file_path}`)
    }
    console.log()
  }

  // E) Summary
  console.log('═══════════════════════════════════════════════════════')
  console.log('  SUMMARY')
  console.log('═══════════════════════════════════════════════════════\n')
  console.log(`   Files on disk:              ${diskFiles.length} (${formatBytes(totalSizeBytes)})`)
  console.log(`   training_resources rows:    ${resources?.length || 0}`)
  console.log(`   training_lessons scanned:   ${lessons?.length || 0}`)
  console.log(`   Inline content refs found:  ${inlineRefs.reduce((n, r) => n + r.paths.length, 0)}`)
  console.log(`   ✅ DB refs with file:       ${foundOnDisk.length}`)
  console.log(`   ❌ DB refs missing file:     ${missingOnDisk.length}`)
  console.log(`   🔶 Orphan files (no DB ref): ${orphanedFiles.length}`)
  console.log()
  console.log('   This audit is READ-ONLY. No changes were made.')
  console.log()
}

main().catch(console.error)

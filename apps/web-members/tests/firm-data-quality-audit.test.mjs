import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

test('directory audit prioritizes misplaced research and explicitly separates completeness from verification', () => {
  const root = path.resolve(tmpdir())
  const temp = mkdtempSync(path.join(root, 'nested-firm-audit-'))
  assert.ok(path.resolve(temp).startsWith(root + path.sep))
  try {
    const input = path.join(temp, 'fixture.json')
    const firm = { id: 'synthetic-1', slug: 'synthetic', name: 'Synthetic firm', is_published: true, source: 'Official-site research. Website: https://example.invalid', vendor_verified: false, verified_at: null }
    writeFileSync(input, JSON.stringify([firm, { ...firm, id: 'synthetic-2', slug: 'other', name: 'Other synthetic firm', source: 'Field', vendor_verified: true, verified_at: '2026-11-14T00:00:00Z' }, { ...firm, id: 'synthetic-hidden', is_published: false }]))
    const script = fileURLToPath(new URL('../scripts/audit-firm-data-quality.mjs', import.meta.url))
    const run = spawnSync(process.execPath, [script, '--local-json=' + input, '--reports-dir=' + temp], { encoding: 'utf8', timeout: 20000 })
    assert.equal(run.status, 0, run.stderr)
    const date = new Date().toISOString().slice(0, 10)
    const report = JSON.parse(readFileSync(path.join(temp, 'directory-data-quality-' + date + '.json'), 'utf8'))
    assert.equal(report.total_firms, 3)
    assert.equal(report.published_firms, 2)
    assert.equal(report.misplaced_research_count, 1)
    assert.equal(report.not_vendor_verified_count, 1)
    assert.equal(report.undated_verification_count, 1)
    assert.equal(report.factual_accuracy_verified, false)
    assert.match(report.score_meaning, /completeness only/i)
    assert.equal(report.all_firms.find(item => item.id === firm.id).priority, 'P0_MISPLACED_RESEARCH')
    assert.equal(report.all_firms.find(item => item.id === firm.id).source, firm.source)
  } finally {
    if (!path.resolve(temp).startsWith(root + path.sep + 'nested-firm-audit-')) throw new Error('Unsafe temporary cleanup path')
    rmSync(temp, { recursive: true, force: true })
  }
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { PGlite } from '@electric-sql/pglite'

const require = createRequire(import.meta.url)

function loadHelper() {
  const code = ts.transpileModule(
    readFileSync(new URL('../lib/firm-reputation.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require, URL, console, Intl })
  return exports
}

const helper = loadHelper()

test('only a suppressed status blocks a firm recommendation', () => {
  assert.equal(helper.isFirmSuppressed({ recommendation_status: 'recommended' }), false)
  assert.equal(helper.isFirmSuppressed({ recommendation_status: 'under_review' }), false)
  assert.equal(helper.isFirmSuppressed({ recommendation_status: 'suppressed' }), true)
})

test('evidence normalization keeps attributed HTTPS sources and rejects unsafe records', () => {
  const normalized = helper.normalizeFirmReputationSources([
    {
      publisher: ' Evidence Publisher ',
      title: ' Source title ',
      url: 'https://evidence.example/report',
      published_at: '2026-09-15',
      summary: 'A third-party allegation.',
      verification_status: 'unverified_third_party_report',
    },
    { publisher: 'Unsafe', title: 'Bad URL', url: 'javascript:alert(1)' },
    { publisher: '', title: 'Missing publisher', url: 'https://evidence.example/missing' },
  ])

  assert.deepEqual(JSON.parse(JSON.stringify(normalized)), [{
    publisher: 'Evidence Publisher',
    title: 'Source title',
    url: 'https://evidence.example/report',
    published_at: '2026-09-15',
    summary: 'A third-party allegation.',
    verification_status: 'unverified_third_party_report',
  }])
})

test('the migration preserves visibility while suppressing both approved firms with attributed evidence', async () => {
  const sql = readFileSync(
    new URL('../../../supabase/migrations/20260916120000_add_firm_reputation_transparency.sql', import.meta.url),
    'utf8',
  )

  assert.match(sql, /recommendation_status text not null default 'recommended'/i)
  assert.equal([...sql.matchAll(/recommendation_status = 'suppressed'/g)].length, 2)
  assert.match(sql, /24-asset-management/)
  assert.match(sql, /national-mortgage-field-services/)
  assert.match(sql, /unverified_third_party_report/g)
  assert.match(sql, /Foreclosurepedia/g)
  assert.doesNotMatch(sql, /is_published\s*=\s*false/i)

  const db = new PGlite()
  await db.exec(`
    create schema if not exists public;
    create table public.firms (
      id text primary key,
      name text not null,
      slug text,
      is_published boolean not null default true
    );
    insert into public.firms (id, name, slug) values
      ('24am', '24 Asset Management', '24-asset-management'),
      ('nmfs', 'National Mortgage Field Services', 'national-mortgage-field-services'),
      ('control', 'Control Firm', 'control-firm');
  `)
  await db.exec(sql)
  const result = await db.query(`
    select slug, is_published, recommendation_status, reputation_notice, reputation_sources
    from public.firms
    order by slug
  `)
  const rows = JSON.parse(JSON.stringify(result.rows))

  assert.deepEqual(rows.map((row) => [row.slug, row.is_published, row.recommendation_status]), [
    ['24-asset-management', true, 'suppressed'],
    ['control-firm', true, 'recommended'],
    ['national-mortgage-field-services', true, 'suppressed'],
  ])
  for (const row of rows.filter((candidate) => candidate.recommendation_status === 'suppressed')) {
    assert.match(row.reputation_notice, /Recommendation paused/)
    assert.equal(row.reputation_sources.length, 1)
    assert.equal(row.reputation_sources[0].publisher, 'Foreclosurepedia')
    assert.equal(row.reputation_sources[0].verification_status, 'unverified_third_party_report')
  }
  await db.close()
})

test('the profile route gates outbound actions and excludes suppressed firms from recommendations', () => {
  const source = readFileSync(new URL('../app/firms/[slug]/page.tsx', import.meta.url), 'utf8')

  assert.match(source, /\.neq\('recommendation_status', 'suppressed'\)/)
  assert.match(source, /const contactHref = isSuppressed\s*\? null/)
  assert.match(source, /!isSuppressed && websiteHref/)
  assert.match(source, /hasContact && !isSuppressed/)
  assert.match(source, /<FirmReputationNotice/)
})

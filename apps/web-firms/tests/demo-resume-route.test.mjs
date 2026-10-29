import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

const compile = path => ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
const fixtures = moduleUrl(compile('../lib/demo-inspectors.ts'))
const details = moduleUrl(compile('../lib/demo-profile-details.ts'))
const source = compile('../app/inspectors/[id]/resume/download/route.ts')
  .replaceAll('../../../../../lib/demo-inspectors', fixtures)
  .replaceAll('../../../../../lib/demo-profile-details', details)
const { GET, generateStaticParams } = await import(moduleUrl(source))

test('resume endpoint serves a disclosed attachment only for shared sample records', async () => {
  assert.deepEqual(generateStaticParams().map(p=>p.id), ['insp-001','insp-004','insp-005'])
  const response = GET(new Request('https://example.test/'), {params:{id:'insp-001'}})
  assert.equal(response.status,200)
  assert.equal(response.headers.get('content-type'),'text/plain; charset=utf-8')
  assert.equal(response.headers.get('x-content-type-options'),'nosniff')
  assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow')
  assert.equal(response.headers.get('content-disposition'),'attachment; filename="nested-objects-insp-001-fictional-resume.txt"')
  const content = await response.text()
  assert.match(content,/^NESTED OBJECTS — FICTIONAL SAMPLE RÉSUMÉ/)
  assert.match(content,/Marcus Davis/)
  assert.doesNotMatch(content,/@|https?:\/\//)
})

test('direct resume URLs cannot expose private, missing, unavailable or unknown samples', async () => {
  for(const id of ['insp-002','insp-003','insp-006','unknown','../../members']) {
    const response=GET(new Request('https://example.test/'),{params:{id}})
    assert.equal(response.status,404)
    assert.equal(response.headers.get('content-disposition'),null)
    assert.equal(await response.text(),'Sample résumé not found.')
  }
})

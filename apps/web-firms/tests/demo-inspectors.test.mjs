import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const file = new URL('../lib/demo-inspectors.ts', import.meta.url)
const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { demoInspectors, filterDemoInspectors } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'))
test('empty search preserves all six original fictional fixture IDs', () => {
  assert.deepEqual(filterDemoInspectors('', '').map(x => x.id), ['insp-001','insp-002','insp-003','insp-004','insp-005','insp-006'])
})
test('city and state search is trimmed and case insensitive', () => {
  assert.deepEqual(filterDemoInspectors(' ATLANTA ', '').map(x => x.name), ['Marcus Davis'])
  assert.deepEqual(filterDemoInspectors('tx', '').map(x => x.name), ['Sarah Kim'])
})
test('specialty text search spans multiple fictional profiles', () => {
  assert.equal(filterDemoInspectors('occupancy', '').length, 3)
})
test('query and specialty filters intersect', () => {
  assert.deepEqual(filterDemoInspectors('Miami', 'Insurance Inspection').map(x=>x.name), ['Tony Rodriguez'])
  assert.equal(filterDemoInspectors('Atlanta', 'Insurance Inspection').length, 0)
})
test('inspection-type filtering uses explicit selections rather than inferred experience specialties', () => {
  assert.deepEqual(filterDemoInspectors('', 'Occupancy Verification').map(x=>x.id), ['insp-001','insp-006'])
  assert.equal(filterDemoInspectors('James', 'Occupancy Verification').length, 0)
  assert.equal(filterDemoInspectors('Commercial Appraisal', '').length, 1)
  assert.equal(filterDemoInspectors('', 'Commercial Appraisal').length, 0)
})
test('no-match search returns no made-up results or coverage', () => {
  assert.deepEqual(filterDemoInspectors('unrepresented area', ''), [])
})
test('filtering never mutates the original sample data', () => {
  const before=JSON.stringify(demoInspectors)
  filterDemoInspectors('REO','REO')
  assert.equal(JSON.stringify(demoInspectors),before)
})
test('public fixtures contain no contact, member IDs, performance, or verification fields', () => {
  for(const person of demoInspectors) assert.deepEqual(Object.keys(person).sort(), ['id','inspectionTypes','location','name','specialties','yearsExp'])
})

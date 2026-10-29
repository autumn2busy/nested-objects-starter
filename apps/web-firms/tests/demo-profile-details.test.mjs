import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
async function load(relative) {
  const compiled = ts.transpileModule(fs.readFileSync(new URL(relative, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
  return import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'))
}
const { calculateSampleTrustScore, demoMemberSignals, getDemoProfileDetails, createSampleResumeDownload, getSampleResumeState } = await load('../lib/demo-profile-details.ts')
const { calculateTrustScore } = await load('../../web-members/lib/trust-score.ts')
const { demoInspectors } = await load('../lib/demo-inspectors.ts')
test('sample Trust Score matches the current member-side calculation across statuses, progress, and caps', () => {
  for (const status of ['verified','completed','pending_verification','pending','not_started','failed',undefined]) {
    for (const total of [4,8,0]) for (const completed of [0,1,3,4,6,8,10]) {
      const input={background_check_status:status,training_modules_completed:completed,training_modules_total:total}
      assert.deepEqual(calculateSampleTrustScore(input),calculateTrustScore(input))
    }
  }
})
test('sample profile signals cover exactly the six fictional inspector IDs', () => {
  assert.deepEqual(Object.keys(demoMemberSignals).sort(), demoInspectors.map(p=>p.id).sort())
  assert.equal(getDemoProfileDetails(demoInspectors[0]).score.total,88)
})
test('pending checks and missing ShieldIDs do not become verified claims', () => {
  const pending=getDemoProfileDetails(demoInspectors[2])
  assert.equal(pending.score.breakdown.background,10)
  assert.match(pending.backgroundLabel,/^Pending verification/)
  const unstarted=getDemoProfileDetails(demoInspectors[5])
  assert.equal(unstarted.score.breakdown.background,0)
  assert.equal(unstarted.signals.shieldId,null)
  assert.match(unstarted.backgroundLabel,/^Not started/)
})
test('sample history, identifiers, and resume are consistent and contain no contact data', () => {
  for(const person of demoInspectors) {
    const details=getDemoProfileDetails(person)
    assert.equal(details.workHistory.length,2)
    assert.match(details.workHistory[0].company,/^Example /)
    assert.match(details.workHistory[1].period,new RegExp('^'+(2026-person.yearsExp)))
    assert.equal(details.profileCompletion,100)
    if(details.signals.shieldId) assert.match(details.signals.shieldId,/^DEMO-ONLY-/)
    assert.doesNotMatch(JSON.stringify(details),/@|https?:\/\//)
    assert.ok(details.skills.includes(person.specialties[0]))
  }
})
test('unknown inspector identifiers cannot receive an invented member profile', () => {
  assert.throws(()=>getDemoProfileDetails({...demoInspectors[0],id:'unknown'}),/Unknown fictional profile/)
  assert.throws(()=>createSampleResumeDownload({...demoInspectors[0],id:'unknown'}),/Unknown fictional profile/)
})
test('downloaded résumés retain fictional disclosures and the displayed profile data', () => {
  for (const person of demoInspectors) {
    const details=getDemoProfileDetails(person)
    if (getSampleResumeState(person.id) !== 'shared') {
      assert.throws(()=>createSampleResumeDownload(person), /not shared/)
      continue
    }
    const resume=createSampleResumeDownload(person)
    assert.equal(resume.filename,`nested-objects-${person.id}-fictional-resume.txt`)
    assert.ok(resume.text.startsWith('NESTED OBJECTS — FICTIONAL SAMPLE RÉSUMÉ\r\n'))
    for (const value of [person.name,person.location,details.summary,details.backgroundLabel,...details.skills]) assert.ok(resume.text.includes(value))
    for (const work of details.workHistory) {
      for (const value of [work.company+' (fictional)',work.role,work.period,work.description,...work.bullets]) assert.ok(resume.text.includes(value))
    }
    assert.ok(resume.text.includes(`Illustrative Trust Score: ${details.score.total}/100`))
    assert.ok(resume.text.includes('No screening or availability is verified.'))
    assert.doesNotMatch(resume.text,/@|https?:\/\//)
  }
})
test('private, not-uploaded and unavailable samples never produce a resume download', () => {
  assert.equal(getSampleResumeState('insp-002'),'private')
  assert.equal(getSampleResumeState('insp-003'),'not_uploaded')
  assert.equal(getSampleResumeState('insp-006'),'unavailable')
  assert.equal(getSampleResumeState('unknown'),'unavailable')
  for (const id of ['insp-002','insp-003','insp-006']) {
    assert.throws(()=>createSampleResumeDownload(demoInspectors.find(p=>p.id===id)),/not shared/)
  }
})

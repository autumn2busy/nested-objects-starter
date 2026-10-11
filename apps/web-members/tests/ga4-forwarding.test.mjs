import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
const config=JSON.parse(readFileSync(new URL('./fixtures/gtm-inspector-acquisition.json',import.meta.url)))
const cv=config.containerVersion, tag=cv.tag.find(t=>t.type==='gaawe'), trigger=cv.trigger[0]
const value=(item,key)=>item.parameter.find(p=>p.key===key)?.value
const eventRegex=new RegExp(value(trigger.customEventFilter[0],'arg1'))
const hostRegex=new RegExp(value(trigger.filter[0],'arg1'))
const matches=(event,host)=>eventRegex.test(event)&&hostRegex.test(host)
test('native Google base configuration remains exact and independently fires once',()=>{
 const base=cv.tag.find(t=>t.tagId==='3')
 assert.equal(base.fingerprint,'1749305850020'); assert.equal(value(base,'tagId'),'G-NCQC8C8V6J')
 assert.deepEqual(base.firingTriggerId,['2147479573']); assert.equal(base.tagFiringOption,'ONCE_PER_EVENT')
 assert.equal(cv.container.publicId,'GTM-5CTHWMFH')
})
test('each intended event matches exact Production public/member hosts',()=>{
 for(const event of ['intent_page_view','acquisition_cta_click','pricing_view','pricing_cta_click','join_free_click','signup_started','upgrade_clicked','upgrade_started','outseta_modal_open','paywall_hit'])
  for(const host of ['nestedobjects.com','www.nestedobjects.com','members.nestedobjects.com']) assert.equal(matches(event,host),true)
})
test('local, Preview, firm, deceptive and unrelated hosts cannot fire',()=>{
 for(const host of ['localhost','127.0.0.1','nested-objects.vercel.app','firms.nestedobjects.com','members.nestedobjects.com.attacker.invalid','unrelated.invalid']) assert.equal(matches('intent_page_view',host),false)
})
test('payment, private tool receipts, trial and lifecycle signals are excluded',()=>{
 for(const event of ['purchase','start_trial','signup_completed','income_scenario_completed','profile_completed','lifecycle_email_consent_requested','click','page_view','pricing_view_extra']) assert.equal(matches(event,'members.nestedobjects.com'),false)
 assert.equal(value(tag,'sendEcommerceData'),'false'); assert.equal(value(tag,'measurementIdOverride'),'G-NCQC8C8V6J')
 assert.equal(value(tag,'eventName'),'{{Event}}'); assert.equal(tag.tagFiringOption,'ONCE_PER_EVENT'); assert.deepEqual(tag.firingTriggerId,[trigger.triggerId])
})
test('all 23 event parameters resolve to native v2 data-layer variables and matching report definitions',()=>{
 const rows=tag.parameter.find(p=>p.key==='eventSettingsTable').list
 const fields=rows.map(row=>row.map.find(p=>p.key==='parameter').value)
 assert.equal(fields.length,23); assert.equal(new Set(fields).size,23)
 for(const row of rows){
  const name=row.map.find(p=>p.key==='parameterValue').value.slice(2,-2)
  const variable=cv.variable.find(v=>v.name===name)
  assert.ok(variable); assert.equal(variable.type,'v'); assert.equal(value(variable,'dataLayerVersion'),'2')
  assert.equal(value(variable,'name'),'acquisition.'+row.map.find(p=>p.key==='parameter').value)
 }
 const definitions=JSON.parse(readFileSync(new URL('./fixtures/ga4-acquisition-custom-definitions.json',import.meta.url)))
 assert.equal(definitions.property,'properties/492401542'); assert.equal(definitions.scope,'EVENT'); assert.deepEqual(definitions.eventParameters,fields)
})
test('no arbitrary identity, calculator, provider ID, custom JS or user-property mappings exist',()=>{
 const text=JSON.stringify({tag,variables:cv.variable})
 for(const prohibited of ['email','memberUid','anonymousId','sessionId','income','planUid','user_properties','customJavascript']) assert.equal(text.includes(prohibited),false)
 assert.ok(cv.variable.every(v=>v.type==='v'))
})

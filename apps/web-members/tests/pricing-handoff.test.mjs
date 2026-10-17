import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

function load(path, imports = {}, globals = {}) {
 const exports = {}
 const code = ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'), {
  compilerOptions: {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
 }).outputText
 vm.runInNewContext(code,{exports,crypto:{randomUUID:()=> 'synthetic-attempt'},...globals,
  require(name){assert.ok(name in imports,'Unexpected import '+name);return imports[name]}})
 return exports
}
const helper=load('../lib/pricing-handoff.ts')
const report=load('../lib/pricing-handoff-report.ts')
const plans=load('../lib/plan-config.ts')
const funnel=load('../lib/conversion-funnel.ts',{'./plan-config':plans,'./verification-traffic': load('../lib/verification-traffic.ts'), './pricing-handoff-report':report})
function harness(initial = false) {
 let visible=initial,check,stopCount=0,recovery=0,observed=0
 const timers=[],events=[]
 const handoff=helper.beginPricingHandoff({widget:'profile',emit:e=>events.push(e),
  visible:()=>visible,observe:fn=>{check=fn;return()=>stopCount++},
  schedule:fn=>{const timer={fn,active:true};timers.push(timer);return()=>{timer.active=false}},
  unavailable:()=>recovery++,observed:()=>observed++})
 return {handoff,events,timers,setVisible:v=>{visible=v;check()},timeout:()=>timers.filter(t=>t.active).at(-1)?.fn(),
  get recovery(){return recovery},get observed(){return observed},get stopCount(){return stopCount}}
}
test('request, newly visible widget and close share one attempt; duplicates are suppressed',()=>{
 const h=harness();h.handoff.check();assert.deepEqual(h.events.map(e=>e.handoffStatus),['requested'])
 h.setVisible(true);h.setVisible(true);assert.equal(h.observed,1)
 h.setVisible(false);h.setVisible(false)
 assert.deepEqual(h.events.map(e=>e.handoffStatus),['requested','widget_visible','closed'])
 assert.equal(new Set(h.events.map(e=>e.handoffId)).size,1);assert.equal(h.recovery,0);assert.equal(h.stopCount,1)
})
test('an already visible unrelated widget does not establish a new opening',()=>{
 const h=harness(true);h.handoff.check();h.timeout()
 assert.deepEqual(h.events.map(e=>e.handoffStatus),['requested','unobserved_timeout']);assert.equal(h.recovery,1)
})
test('silent provider handoff is unknown and permits explicit recovery, with no auto retry',()=>{
 const h=harness();h.timeout();h.handoff.recovery();h.timeout()
 assert.deepEqual(h.events.map(e=>e.handoffStatus),['requested','unobserved_timeout','recovery_redirect_requested'])
 assert.equal(h.recovery,1)
})
test('SDK exception is reported once using a fixed reason, without provider error text',()=>{
 const h=harness();h.handoff.failed();h.handoff.failed();h.timeout()
 assert.deepEqual(h.events.map(e=>e.handoffStatus),['requested','open_failed'])
 assert.equal(h.events[1].reason,'sdk_exception');assert.equal(h.recovery,1)
})
test('hosted navigation is a request, never confirmed arrival or payment',()=>{
 const h=harness();h.handoff.redirect();h.handoff.redirectFailed()
 assert.deepEqual(h.events.map(e=>e.handoffStatus),['requested','hosted_redirect_requested','hosted_redirect_failed'])
 assert.equal(h.recovery,1)
})
test('unmount and the bounded post-opening timer stop observation without manufacturing abandonment',()=>{
 for(const opened of [false,true]){const h=harness();if(opened)h.setVisible(true);h.handoff.stop();h.timeout();h.setVisible(false)
  assert.deepEqual(h.events.map(e=>e.handoffStatus),opened?['requested','widget_visible']:['requested'])}
 const h=harness();h.setVisible(true);h.timeout();assert.equal(h.stopCount,1);assert.equal(h.recovery,0)
})
test('telemetry failure never prevents an attempted handoff',()=>{
 let observed=false
 const h=helper.beginPricingHandoff({widget:'auth',emit(){throw Error('storage unavailable')},
  visible:()=>false,observe(){observed=true;return()=>{}},schedule:()=>()=>{},unavailable(){}})
 assert.ok(h.handoffId);assert.equal(observed,true);h.stop()
})
test('visibility requires the correct provider popup, layout and visible ancestors',()=>{
 let hidden=false,rects=[{}],style={display:'block',visibility:'visible',opacity:'1'},selector
 const element={getClientRects:()=>rects,getAttribute:()=>null,get hidden(){return hidden},parentElement:null}
 const dom=load('../lib/pricing-handoff.ts',{}, {document:{querySelectorAll:s=>{selector=s;return[element]}},window:{getComputedStyle:()=>style}})
 assert.equal(dom.pricingWidgetVisible('profile'),true);assert.equal(selector,'.o--App--profileWidget.o--Widget--popup')
 hidden=true;assert.equal(dom.pricingWidgetVisible('profile'),false);hidden=false;rects=[];assert.equal(dom.pricingWidgetVisible('auth'),false)
 rects=[{}];style={...style,display:'none'};assert.equal(dom.pricingWidgetVisible('auth'),false)
 element.parentElement={getAttribute:()=>null,hidden:true,parentElement:null};style.display='block';assert.equal(dom.pricingWidgetVisible('profile'),false)
})

test('readiness selects the requested module and has a bounded timeout',async()=>{
 const timers=[],controller=new AbortController()
 let available=false
 const opening=helper.waitForPricingWidget('profile',controller.signal,{ready:()=>available,
  schedule:(fn,ms)=>{const timer={fn,ms,active:true};timers.push(timer);return()=>{timer.active=false}}})
 assert.equal(timers.find(t=>t.ms===8000).active,true)
 available=true;timers.find(t=>t.ms===100).fn()
 assert.equal(await opening,true)
 assert.ok(timers.every(t=>!t.active))
 const expired=[]
 const missing=helper.waitForPricingWidget('auth',controller.signal,{ready:()=>false,
  schedule:(fn,ms)=>{const timer={fn,ms,active:true};expired.push(timer);return()=>{timer.active=false}}})
 expired.find(t=>t.ms===8000).fn()
 assert.equal(await missing,false);assert.ok(expired.every(t=>!t.active))
})

test('identity change or unmount cancels SDK readiness without a late open',async()=>{
 const timers=[],controller=new AbortController()
 let reads=0
 const opening=helper.waitForPricingWidget('profile',controller.signal,{ready:()=>{reads++;return false},
  schedule:fn=>{const timer={fn,active:true};timers.push(timer);return()=>{timer.active=false}}})
 controller.abort()
 assert.equal(await opening,false);assert.ok(timers.every(t=>!t.active))
 const before=reads;timers.forEach(t=>t.fn());assert.equal(reads,before)
 assert.equal(await helper.waitForPricingWidget('profile',controller.signal,{ready:()=>{throw Error('Must not read after cancel')}}),false)
})
const base={id:'fixture',anonymous_id:null,member_uid:'synthetic-member',member_email:null,plan_uid:plans.PLAN_UIDS.FREE,plan_name:'Free',
 source_page:'/membership-pricing',source:'fixture',reason:null,utm_source:null,utm_medium:null,utm_campaign:null,
 occurred_at:'2026-10-12T12:00:00Z',event_data:{targetPlan:'Pro',targetPlanUid:plans.PLAN_UIDS.PRO}}
const event=(name,data={},extra={})=>({...base,event_name:name,event_data:{...base.event_data,...data},...extra})
const attempt=status=>event('checkout_handoff',{handoffContract:'pricing-handoff-v1',handoffId:'handoff:synthetic-attempt',handoffStatus:status,mode:'profile_plan_change'})
test('legacy generic upgrade interest is separate from actual paid-plan CTA and new evidence',()=>{
 const r=funnel.buildConversionFunnel([event('signup_completed'),event('upgrade_clicked'),event('outseta_modal_open',{mode:'profile_plan_change'})])
 assert.equal(r.checkoutHandoffs.generalUpgradeOnlyMembers,1);assert.equal(r.checkoutHandoffs.attempts,0);assert.equal(r.checkoutHandoffs.visible,0)
})
test('correlated report suppresses duplicates and cannot infer visibility or payment from requests',()=>{
 const r=funnel.buildConversionFunnel([event('signup_completed'),event('pricing_cta_click',{handoffId:'handoff:synthetic-attempt'}),attempt('requested'),attempt('requested'),attempt('widget_visible'),attempt('closed')])
 assert.equal(r.checkoutHandoffs.attempts,1);assert.equal(r.checkoutHandoffs.visible,1);assert.equal(r.checkoutHandoffs.closed,1)
 assert.equal(r.stages.at(-1).count,0);assert.equal(r.checkoutHandoffs.selectedPlanWithoutHandoff,0)
 const missing=funnel.buildConversionFunnel([event('signup_completed'),event('pricing_cta_click')])
 assert.equal(missing.checkoutHandoffs.selectedPlanWithoutHandoff,1)
 const mismatched=funnel.buildConversionFunnel([event('signup_completed'),event('pricing_cta_click',{handoffId:'handoff:other-attempt'}),attempt('requested')])
 assert.equal(mismatched.checkoutHandoffs.selectedPlanWithoutHandoff,1)
})
test('verification, admin, pre-signup, wrong contract/target and unpaired outcomes do not count',()=>{
 const rows=[event('signup_completed'),attempt('requested'),attempt('widget_visible')]
 assert.equal(funnel.buildConversionFunnel(rows,{excludedMemberUids:['synthetic-member']}).checkoutHandoffs.attempts,0)
 assert.equal(funnel.buildConversionFunnel(rows.map(r=>({...r,source:'verification'}))).checkoutHandoffs.attempts,0)
 for(const bad of [event('checkout_handoff',{handoffContract:'wrong'}),attempt('widget_visible'),
  {...attempt('requested'),occurred_at:'2026-10-11T12:00:00Z'},
  event('checkout_handoff',{...attempt('requested').event_data,targetPlanUid:plans.PLAN_UIDS.FREE})]) {
  assert.equal(funnel.buildConversionFunnel([event('signup_completed'),bad]).checkoutHandoffs.attempts,0)
 }
 const wrong=event('checkout_handoff',{...attempt('widget_visible').event_data,targetPlan:'Elite',targetPlanUid:plans.PLAN_UIDS.ELITE})
 const r=funnel.buildConversionFunnel([event('signup_completed'),attempt('requested'),wrong]);assert.equal(r.checkoutHandoffs.visible,0);assert.equal(r.checkoutHandoffs.unobserved,1)
})

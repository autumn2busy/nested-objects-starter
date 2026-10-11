import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
const require = createRequire(import.meta.url)
const sandbox = vm.createContext({ URLSearchParams, AbortSignal, process: { env: {} } })
function load(path, imports = {}) {
  const exports = {}
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText
  sandbox.exports = exports
  sandbox.require = name => { if (name === 'server-only') return {}; if (name in imports) return imports[name]; return require(name) }
  vm.runInContext('(function(exports, require) {' + code + '\n})(exports, require)', sandbox)
  return exports
}
const plans = load('../lib/plan-config.ts')
const funnel = load('../lib/conversion-funnel.ts', { './plan-config': plans })
const payments = load('../lib/conversion-payment-report.ts')
const query = load('../lib/conversion-report-query.ts')
// Run the existing identity/stage regression suite against the changed implementation.
load('../lib/conversion-funnel.test.ts', { './conversion-funnel': funnel, './plan-config': plans })
const event = (name, time, extra = {}) => ({
  id: name + time, event_name: name, member_uid: 'm1', member_email: 'member@example.com',
  anonymous_id: 'a1', plan_name: 'Free', plan_uid: plans.PLAN_UIDS.FREE, source_page: '/welcome',
  source: null, reason: null, utm_source: null, utm_medium: null, utm_campaign: null, event_data: {},
  occurred_at: '2026-10-01T' + time + ':00Z', ...extra,
})
test('recovers pre-signup campaign through a later unambiguous authenticated browser link', () => {
  const result = funnel.buildConversionFunnel([
    event('signup_started','09:55',{ member_uid:null,member_email:null,utm_source:'youtube' }),
    event('signup_completed','10:00',{ anonymous_id:null,source:'outseta',source_page:'outseta_webhook' }),
    event('directory_viewed','10:05'),
  ],{source:'youtube'})
  assert.equal(result.cohortSize,1)
  assert.equal(result.attributionCoverage.recovered,1)
  assert.equal(result.cohortMembers[0].source,'youtube')
  assert.equal(result.attributionCoverage.campaignKnown,1)
})

test('internal entry points do not become external acquisition campaigns',()=>{
  const r=funnel.buildConversionFunnel([event('signup_started','09:55',{source:'site_header'}),event('signup_completed','10:00',{source:'outseta'})])
  assert.equal(r.attributionCoverage.recovered,1);assert.equal(r.attributionCoverage.campaignKnown,0)
})
test('a late duplicate browser signup cannot overwrite the original acquisition',()=>{
  const r=funnel.buildConversionFunnel([event('signup_completed','10:00',{source:'outseta'}),event('signup_completed','10:10',{utm_source:'onboarding'})])
  assert.equal(r.attributionCoverage.unknown,1);assert.equal(r.attributionCoverage.campaignKnown,0)
})
test('an email shared by two UIDs cannot stitch an email-only acquisition',()=>{
  const r=funnel.buildConversionFunnel([event('signup_started','09:55',{member_uid:null,anonymous_id:null,utm_source:'youtube'}),event('signup_completed','10:00',{anonymous_id:null}),event('signup_completed','10:01',{member_uid:'m2',anonymous_id:null})])
  assert.equal(r.cohortSize,2);assert.equal(r.attributionCoverage.recovered,0)
})
test('does not assign a later onboarding campaign to signup', () => {
  const result=funnel.buildConversionFunnel([
    event('signup_completed','10:00',{source:'outseta',source_page:'outseta_webhook'}),
    event('directory_viewed','10:05',{utm_source:'activecampaign',event_data:{first_utm_source:'activecampaign'}}),
  ])
  assert.equal(result.attributionCoverage.unknown,1)
  assert.equal(result.cohortMembers[0].source,'Direct / unknown')
})
test('does not recover acquisition from a shared browser or ambiguous email', () => {
  const rows=[event('signup_started','09:55',{member_uid:null,member_email:null,utm_source:'youtube'}),
    event('signup_completed','10:00'),event('signup_completed','10:01',{member_uid:'m2',member_email:'other@example.com'})]
  assert.equal(funnel.buildConversionFunnel(rows).attributionCoverage.recovered,0)
})
test('resolves email-only events to a UID without creating a shared-browser conflict', () => {
  const result=funnel.buildConversionFunnel([event('signup_started','09:55',{member_uid:null,utm_source:'youtube'}),event('signup_completed','10:00')])
  assert.equal(result.attributionCoverage.recovered,1)
  assert.equal(result.ambiguousAnonymousIds,0)
})
test('lookback does not expand the signup cohort or include later duplicate signup plans', () => {
  const result=funnel.buildConversionFunnel([event('signup_completed','09:00'),
    event('signup_completed','10:00',{member_uid:'m2',anonymous_id:'a2',plan_name:'Free'}),
    event('signup_completed','10:01',{member_uid:'m2',anonymous_id:'a2',plan_name:'Pro'})],
    {signupSince:'2026-10-01T09:30:00Z',signupUntil:'2026-10-01T11:00:00Z',plan:'free'})
  assert.equal(result.cohortSize,1)
})
test('verification campaign exclusions propagate to its unlabelled browser events', () => {
  const result=funnel.buildConversionFunnel([event('signup_started','09:55',{utm_source:'release_validation',utm_medium:'qa'}),
    event('signup_completed','10:00'),event('pricing_view','10:05')])
  assert.equal(result.cohortSize,0)
  assert.equal(result.excludedEvents,3)
})
test('login-required firm redirects do not count as deliberate pricing views', () => {
  const result=funnel.buildConversionFunnel([event('signup_completed','10:00'),
    event('pricing_view','10:05',{source:'firm-profile',reason:'login-required'})])
  assert.equal(result.stages.find(s=>s.key==='pricing').count,0)
})
const members=[{memberUid:'m1',accountUid:'acct1'}]
const account={Uid:'acct1',IsDemo:false,AccountStageLabel:'Trialing',CurrentSubscription:{Rate:49,RenewalDate:'2026-10-18T00:00:00Z'}}
const invoice={Uid:'inv1',InvoiceDate:'2026-10-01T00:00:00Z',BillingInvoiceStatus:2,AmountPaid:49,AmountRefunded:0,AmountOutstanding:0,Subscription:{Account:{Uid:'acct1'}}}
const transaction={Uid:'tx1',TransactionDate:'2026-10-01T00:00:00Z',BillingTransactionType:2,Amount:-49,IsCaptured:true,IsElectronicTransaction:true,Account:{Uid:'acct1'},Invoice:{Uid:'inv1'}}
const evidence=(extra={})=>({accounts:[account],invoices:[],transactions:[],...extra})
test('paid-plan trials and zero-dollar paid invoices are not collected payments',()=>{
  const r=payments.reconcilePaymentEvidence(members,evidence({invoices:[{...invoice,AmountPaid:0}]}))
  assert.equal(r.recordedPaidMembers,0);assert.equal(r.trialingMembers,1)
})
test('Free labelled Trialing is not a paid trial',()=>{
  assert.equal(payments.reconcilePaymentEvidence(members,evidence({accounts:[{...account,CurrentSubscription:{Rate:0}}]})).trialingMembers,0)
})
test('captured negative Payment transactions count and do not double-count their invoice',()=>{
  const r=payments.reconcilePaymentEvidence(members,evidence({invoices:[invoice,invoice],transactions:[transaction,transaction]}))
  assert.equal(r.recordedPaidMembers,1);assert.equal(r.recordedAmount,49)
})
test('uncaptured payments and invoice-type transactions do not count',()=>{
  for(const t of [{...transaction,IsCaptured:false},{...transaction,BillingTransactionType:1}]){
    assert.equal(payments.reconcilePaymentEvidence(members,evidence({transactions:[t]})).recordedPaidMembers,0)
  }
})
test('older-account payments and demo-account invoices cannot inflate the cohort',()=>{
  assert.equal(payments.reconcilePaymentEvidence(members,evidence({transactions:[{...transaction,Account:{Uid:'older'}}]})).recordedPaidMembers,0)
  assert.equal(payments.reconcilePaymentEvidence(members,evidence({accounts:[{...account,IsDemo:true}],invoices:[invoice]})).recordedPaidMembers,0)
})
test('fully refunded invoices are reported separately from retained payment',()=>{
  const r=payments.reconcilePaymentEvidence(members,evidence({invoices:[{...invoice,AmountRefunded:49}],transactions:[transaction]}))
  assert.equal(r.recordedPaidMembers,0);assert.equal(r.refundedMembers,1)
})
test('conflicting unpaid invoice and captured transaction cannot become confirmed payment',()=>{
  const r=payments.reconcilePaymentEvidence(members,evidence({invoices:[{...invoice,AmountPaid:0}],transactions:[transaction]}))
  assert.equal(r.recordedPaidMembers,0);assert.equal(r.unknownMembers,1);assert.equal(r.status,'partial')
})
test('captured payment retains its account and net amount when invoice has no subscription',()=>{
  const r=payments.reconcilePaymentEvidence(members,evidence({invoices:[{...invoice,Subscription:null,AmountRefunded:10}],transactions:[transaction]}))
  assert.equal(r.recordedPaidMembers,1);assert.equal(r.recordedAmount,39)
})
test('unmatched identities or incomplete reads stay unknown',()=>{
  for(const r of [payments.reconcilePaymentEvidence([{memberUid:'unknown',accountUid:null}],evidence()),
    payments.reconcilePaymentEvidence(members,evidence(),false)]){
    assert.equal(r.status,'partial');assert.equal(r.unknownMembers,1)
  }
})
const window={startDate:'2026-09-27T00:00:00Z',endDate:'2026-10-11T00:00:00Z'}
const response=data=>({ok:true,json:async()=>data})
test('provider reader is GET-only, exact-account scoped and uncached',async()=>{
  const calls=[]
  const r=await payments.readConversionPaymentReport(members,window,{apiKey:'fixture',apiSecret:'fixture',fetcher:async(url,options)=>{
    calls.push({url,options})
    return response(url.includes('crm/accounts/')?account:{items:[],metadata:{total:0}})
  }})
  assert.equal(r.status,'complete')
  assert.equal(calls.length,3)
  assert.ok(calls.every(c=>c.options.method==='GET'&&c.options.cache==='no-store'&&c.url.includes('donotlog=1')))
  assert.match(calls[0].url,/crm\/accounts\/acct1\?/)
})
test('credential, HTTP and malformed collection failures cannot report complete zero payments',async()=>{
  assert.equal((await payments.readConversionPaymentReport(members,window)).status,'unavailable')
  for(const collection of [{ok:false,json:async()=>({secret:'do not echo'})},
    response({items:[{Uid:'bad',InvoiceDate:'2026-10-01T00:00:00Z'}],metadata:{total:1}})]){
    const r=await payments.readConversionPaymentReport(members,window,{apiKey:'fixture',apiSecret:'fixture',
      fetcher:async url=>url.includes('crm/accounts/')?response(account):collection})
    assert.equal(r.status,'unavailable')
  }
})
test('provider cap or incomplete pages leave outcomes unknown',async()=>{
  const r=await payments.readConversionPaymentReport(members,window,{apiKey:'fixture',apiSecret:'fixture',
    fetcher:async url=>url.includes('crm/accounts/')?response(account):response({items:[],metadata:{total:1000}})})
  assert.notEqual(r.status,'complete')
})
test('paginated event reads recover beyond the database default response cap',async()=>{
  const calls=[]
  const fake={from(){return {select(){return this},gte(){return this},lt(){return this},order(){return this},
    range(start,end){calls.push([start,end]);return Promise.resolve({data:[{id:String(start)}],count:3,error:null})}}}}
  const r=await query.readConversionReportEvents(fake,window.startDate,window.endDate)
  assert.equal(r.rows.length,3);assert.equal(r.resultsLimited,false);assert.equal(calls.length,3)
})
test('a later page failure keeps event coverage partial and unavailable',async()=>{
  let n=0
  const fake={from(){return {select(){return this},gte(){return this},lt(){return this},order(){return this},
    range(){n++;return Promise.resolve(n===1?{data:[{id:'1'}],count:3,error:null}:{data:null,count:null,error:{message:'fixture'}})}}}}
  const r=await query.readConversionReportEvents(fake,window.startDate,window.endDate)
  assert.equal(r.error,true);assert.equal(r.resultsLimited,true)
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import crypto from 'node:crypto'
function load(path, modules = {}, globals = {}) {
  const source=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText
  const ctx={exports:{},require:name=>{if(!(name in modules))throw Error('Unexpected dependency '+name);return modules[name]},AbortSignal,Buffer,...globals}
  vm.runInNewContext(source,ctx);return ctx.exports
}
const {verifyStripeReadiness}=load('../lib/stripe-readiness.ts')
const input={expectedStripeAccountId:'acct_expected',outsetaAccountUid:'Account1'}
const env={STRIPE_SECRET_KEY:'rk_live_fixture',OUTSETA_API_KEY:'fixture',OUTSETA_API_SECRET:'private-fixture'}
function fixture(overrides={}) { const calls=[];return {calls,fetcher:async(url,init)=>{
  calls.push({url,init});assert.equal(init.method,'GET');assert.equal(init.redirect,'error');assert.equal(init.cache,'no-store')
  let body=url.endsWith('/account')?{id:'acct_expected'}:url.includes('/crm/accounts/')?{Uid:'Account1',IsDemo:false,StripeId:'cus_expected'}:
    url.includes('/customers/')?{id:'cus_expected',livemode:true}: {data:[],has_more:false}
  if(overrides.change)body=overrides.change(url,body)
  if(overrides.fail&&url.includes(overrides.fail))return {ok:false,json:async()=>{throw Error('SECRET-MUST-NOT-LEAK')}}
  return {ok:true,json:async()=>body}
}}}
test('live credential read checks exact Stripe account and authoritative Outseta customer using GET only',async()=>{
 const f=fixture();const r=await verifyStripeReadiness(input,env,f.fetcher)
 assert.equal(r.code,'stripe_readiness_verified');assert.equal(f.calls.length,6)
 assert.ok(f.calls.every(x=>!x.init.body));assert.ok(Object.values(r).every(x=>typeof x==='boolean'||x==='stripe_readiness_verified'))
 assert.ok(!JSON.stringify(r).includes('acct_'));assert.ok(!JSON.stringify(r).includes('cus_'));assert.ok(!JSON.stringify(r).includes('fixture'))
})
for(const key of [undefined,'sk_test_fixture','pk_live_fixture','rk_live_fixture\n'])test('rejects absent, test, public, malformed key '+String(key),async()=>{
 let called=false;const r=await verifyStripeReadiness(input,{...env,STRIPE_SECRET_KEY:key},async()=>{called=true})
 assert.equal(r.code,'live_key_required');assert.equal(called,false)
})
test('wrong account stops before Outseta/customer reads',async()=>{
 const f=fixture({change:(url,b)=>url.endsWith('/account')?{id:'acct_other'}:b})
 const r=await verifyStripeReadiness(input,env,f.fetcher);assert.equal(r.code,'stripe_account_mismatch');assert.equal(f.calls.length,1)
})
test('test or deleted Outseta-linked customer never establishes match',async()=>{
 for(const change of [b=>({...b,livemode:false}),b=>({...b,deleted:true})]){
 const f=fixture({change:(url,b)=>url.includes('/customers/')?change(b):b})
 assert.equal((await verifyStripeReadiness(input,env,f.fetcher)).code,'outseta_customer_mismatch')
 }
})
test('permissions and malformed collections remain unverified without leaking provider body',async()=>{
 for(const fail of ['charges?','payment_intents?','refunds?']){
 const f=fixture({fail});const r=await verifyStripeReadiness(input,env,f.fetcher);assert.equal(r.code,'provider_read_unverified');assert.ok(!JSON.stringify(r).includes('SECRET'))
 }
 const f=fixture({change:(url,b)=>url.includes('charges?')?{data:[{livemode:false}],has_more:false}:b})
 assert.equal((await verifyStripeReadiness(input,env,f.fetcher)).code,'provider_read_unverified')
})
const security=load('../lib/security.ts',{crypto})
test('diagnostic rejects unsigned/stale/extra-scope requests before touching Stripe',async()=>{
 let calls=0;const route=load('../app/api/operations/stripe-readiness/route.ts',{
 'next/server':{NextResponse:{json:(data,init)=>({data,...init})}},'@/lib/security':security,
 '@/lib/stripe-readiness':{verifyStripeReadiness:async()=>{calls++;return {code:'stripe_readiness_verified'}}}
 },{process:{env:{OUTSETA_WEBHOOK_SECRET:'auth-fixture'}}})
 const base={operation:'stripe-readiness-v1',issuedAt:Date.now(),...input}
 async function request(data,signed=true){const body=JSON.stringify(data);const signature=crypto.createHmac('sha256','auth-fixture').update(body).digest('hex')
 return route.POST({text:async()=>body,headers:{get:name=>signed&&name==='x-hub-signature-256'?'sha256='+signature:null}})}
 assert.equal((await request(base,false)).status,401)
 assert.equal((await request({...base,issuedAt:Date.now()-121000})).status,400)
 assert.equal((await request({...base,issuedAt:Date.now()+121000})).status,400)
 assert.equal((await request({...base,enableSync:true})).status,400)
 assert.equal((await request({...base,outsetaAccountUid:'../other'})).status,400)
 assert.equal(calls,0)
 const r=await request(base);assert.equal(r.status,200);assert.equal(r.headers['Cache-Control'],'no-store');assert.equal(calls,1)
 assert.equal(route.GET,undefined)
})

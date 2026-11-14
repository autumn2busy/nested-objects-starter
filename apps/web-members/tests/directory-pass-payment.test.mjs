import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

function load(path,modules={}) {
  const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
  const context={exports:{},require:name=>{if(!(name in modules))throw Error('Unexpected dependency '+name);return modules[name]}}
  vm.runInNewContext(code,context);return context.exports
}
const payment=load('../lib/directory-pass-payment.ts')
const sync=load('../lib/active-campaign-pass-orders.ts')
const now='2026-11-14T18:00:00Z'
function evidence() {return {
  observedAt:now,
  account:{uid:'account1',primaryPersonUid:'person1',stripeCustomerId:'cus_fixture',livemode:true,isDemo:false,isQa:false},
  member:{personUid:'person1',accountUid:'account1',acContactId:'123',acCustomerId:'456'},
  invoice:{uid:'invoice1',accountUid:'account1',subscriptionUid:'subscription1',planUid:'Pass199',renewalTerm:4,status:2,currency:'USD',
    outstandingMinor:0,paidMinor:19900,refundedMinor:0,creditMinor:0,isUserGenerated:false,stripeChargeIds:['ch_fixture'],
    lines:[{kind:1,amountMinor:19900,taxMinor:0}]},
  transactions:[{uid:'tx1',accountUid:'account1',invoiceUid:'invoice1',kind:2,amountMinor:-19900,captured:true,electronic:true,occurredAt:'2026-11-14T17:59:05Z'}],
  transactionsComplete:true,
  charge:{id:'ch_fixture',stripeAccountId:'acct_fixture',customerId:'cus_fixture',livemode:true,status:'succeeded',paid:true,captured:true,
    capturedMinor:19900,refundedMinor:0,disputed:false,currency:'usd',createdAt:'2026-11-14T17:59:00Z',paymentIntentId:'pi_fixture'},
  paymentIntent:{id:'pi_fixture',latestChargeId:'ch_fixture',customerId:'cus_fixture',livemode:true,status:'succeeded',captureMethod:'automatic',receivedMinor:19900,currency:'usd'},
  refunds:[],refundsComplete:true,
}}
function decision(e=evidence()){return payment.assessDirectoryPassPayment(e,{planUid:'Pass199',stripeAccountId:'acct_fixture'},now)}
test('an exact captured one-time payment produces its actual amount and UTC time, source 0 only',()=>{
  const d=decision();assert.equal(d.state,'ready');assert.equal(d.order.netMinor,19900)
  assert.equal(d.order.paidAt,'2026-11-14T17:59:05Z');assert.equal(d.order.externalId,'outseta-pass-invoice-invoice1')
  const p=sync.historicalPassOrderPayload(d.order,'4','fixture@example.invalid').ecomOrder
  assert.equal(p.source,0);assert.equal(p.totalPrice,19900);assert.equal(p.externalCreatedDate,d.order.paidAt)
  assert.equal(p.orderProducts[0].externalid,'Pass199');assert.equal(p.orderProducts[0].quantity,1)
  for(const forbidden of ['recurringPayments','renewalDate','contactLists','tags','acceptsMarketing'])assert.equal(forbidden in p,false)
})
test('discounts and tax use captured cash instead of nominal $199',()=>{
  const e=evidence();e.invoice.lines=[{kind:1,amountMinor:19900,taxMinor:1200},{kind:5,amountMinor:-5000,taxMinor:0}]
  e.invoice.paidMinor=16100;e.charge.capturedMinor=16100;e.paymentIntent.receivedMinor=16100;e.transactions[0].amountMinor=-16100
  assert.equal(decision(e).order.netMinor,16100)
})
const rejects={
  'expired evidence':e=>e.observedAt='2026-11-14T17:54:59Z',
  'future evidence':e=>e.observedAt='2026-11-14T18:00:01Z',
  'QA':e=>e.account.isQa=true,'demo':e=>e.account.isDemo=true,'test account':e=>e.account.livemode=false,
  'wrong primary person':e=>e.account.primaryPersonUid='other',
  'wrong stored account':e=>e.member.accountUid='other','wrong invoice account':e=>e.invoice.accountUid='other',
  'missing customer':e=>e.member.acCustomerId='', 'wrong plan':e=>e.invoice.planUid='Pro',
  'recurring plan':e=>e.invoice.renewalTerm=1, 'manual invoice':e=>e.invoice.isUserGenerated=true,
  'outstanding balance':e=>e.invoice.outstandingMinor=1,'zero cash':e=>e.invoice.paidMinor=0,
  'credit allocation':e=>e.invoice.creditMinor=100,'fractional cents':e=>e.invoice.paidMinor=19900.5,
  'extra product':e=>e.invoice.lines.push({kind:3,amountMinor:0,taxMinor:0}),
  'duplicate plan':e=>e.invoice.lines.push({kind:1,amountMinor:19900,taxMinor:0}),
  'unverified totals':e=>e.invoice.lines[0].amountMinor=10000,
  'missing transactions':e=>e.transactionsComplete=false,'missing refund page':e=>e.refundsComplete=false,
  'different charge':e=>e.invoice.stripeChargeIds=['ch_other'],'multiple charges':e=>e.invoice.stripeChargeIds.push('ch_other'),
  'different Stripe customer':e=>e.charge.customerId='cus_other','different intent':e=>e.paymentIntent.id='pi_other',
  'different latest charge':e=>e.paymentIntent.latestChargeId='ch_other','test charge':e=>e.charge.livemode=false,
  'wrong Stripe account':e=>e.charge.stripeAccountId='acct_other','unknown invoice currency':e=>e.invoice.currency=null,
  'wrong invoice currency':e=>e.invoice.currency='EUR',
  'dispute':e=>e.charge.disputed=true,'uncaptured':e=>e.charge.captured=false,'pending payment':e=>e.paymentIntent.status='processing',
  'manual capture date unknown':e=>e.paymentIntent.captureMethod='manual','different currency':e=>e.charge.currency='eur',
  'wrong received amount':e=>e.paymentIntent.receivedMinor=100,'wrong transaction account':e=>e.transactions[0].accountUid='other',
  'wrong invoice transaction':e=>e.transactions[0].invoiceUid='other','duplicate transaction':e=>e.transactions.push({...e.transactions[0]}),
  'uncaptured Outseta payment':e=>e.transactions[0].captured=false,'noncash payment':e=>e.transactions[0].electronic=false,
  'payment sign conflict':e=>e.transactions[0].amountMinor=19900,'stale capture date':e=>e.charge.createdAt='2026-11-12T17:59:00Z',
  'unzoned transaction':e=>e.transactions[0].occurredAt='2026-11-14T17:59:05',
  'unmatched refund':e=>e.invoice.refundedMinor=100,
}
for(const [name,mutate]of Object.entries(rejects))test('withholds '+name,()=>{const e=evidence();mutate(e);assert.notEqual(decision(e).state,'ready')})
function refunded(amount){const e=evidence();e.invoice.refundedMinor=amount;e.charge.refundedMinor=amount
  e.refunds=[{id:'re_fixture',chargeId:'ch_fixture',status:'succeeded',amountMinor:amount,currency:'usd',occurredAt:'2026-11-14T17:59:30Z'}]
  e.transactions.push({uid:'txrefund',accountUid:'account1',invoiceUid:'invoice1',kind:4,amountMinor:amount,captured:true,electronic:true,occurredAt:'2026-11-14T17:59:30Z'})
  return e}
for(const amount of [1000,19900])test('refund '+amount+' yields net amount for owned orders only',()=>{
  const d=decision(refunded(amount));assert.equal(d.state,'ready');assert.equal(d.createAllowed,false);assert.equal(d.order.netMinor,19900-amount)
})
test('pending refunds cannot present settled net revenue',()=>{const e=refunded(1000);e.refunds[0].status='pending';assert.notEqual(decision(e).state,'ready')})
test('Outseta unzoned timestamps normalize as UTC independently of machine timezone',()=>{
  assert.equal(payment.outsetaUtc('2026-11-14T16:27:42'),'2026-11-14T16:27:42.000Z')
  assert.equal(payment.outsetaUtc('2026-11-14T11:27:42-05:00'),'2026-11-14T16:27:42.000Z')
  assert.throws(()=>payment.outsetaUtc('0001-01-01T00:00:00'))
  for(const invalid of ['2026-02-30T12:00:00','2026-02-29T12:00:00Z','2026-11-14T24:00:00','2026-13-01T00:00:00'])assert.throws(()=>payment.outsetaUtc(invalid))
  assert.equal(payment.outsetaAmountMinor(19.99),1999);assert.throws(()=>payment.outsetaAmountMinor(1.005))
})
function ports(options={}){
  const d=decision();const o=d.order;const calls=[]
  let existing=options.existing??null
  const lease={token:'claim-token',writeStarted:false,orderId:null,capturedMinor:19900,refundedMinor:0,...options.lease}
  const record=(order)=>({id:'987',externalId:order.externalId,connectionId:'4',customerId:order.acCustomerId,source:0,totalMinor:order.netMinor,
    currency:order.currency,paidAt:order.paidAt,products:[{externalId:order.planUid,priceMinor:order.netMinor,quantity:1}]})
  const p={
    claim:async()=>{calls.push('claim');return options.busy?null:lease},
    markWriteStarted:async()=>{calls.push('intent');lease.writeStarted=true},
    finish:async(token,result)=>{calls.push(['finish',result])},
    noEmailPreflight:async()=>{calls.push('no-email');if(options.noEmailFailure)throw Error('unsafe')},
    findOrder:async()=>{calls.push('read');return existing},
    createOrder:async(order)=>{calls.push('create');if(!options.uncommitted)existing=record(order);if(options.transportFailure)throw Error('transport')},
    updateOrder:async(id,order)=>{calls.push('update');existing=record(order)},
  };return {p,calls,record,lease}
}
test('one create follows durable intent and no-email preflight, then independent readback',async()=>{
  const f=ports();const r=await sync.syncPassOrder(decision(),'4',f.p);assert.equal(r.state,'verified')
  assert.deepEqual(f.calls.slice(0,6),['claim','read','no-email','intent','create','read'])
  assert.equal(r.automaticWriteRetry,false)
})
test('concurrent worker cannot write',async()=>{const f=ports({busy:true});assert.equal((await sync.syncPassOrder(decision(),'4',f.p)).state,'busy');assert.deepEqual(f.calls,['claim'])})
test('no-email preflight failure prevents write intent and provider write',async()=>{
  const f=ports({noEmailFailure:true});assert.equal((await sync.syncPassOrder(decision(),'4',f.p)).state,'blocked');assert.equal(f.calls.includes('intent'),false);assert.equal(f.calls.includes('create'),false)
})
test('write committed but transport failed is reconciled by GET without another create',async()=>{
  const f=ports({transportFailure:true});const r=await sync.syncPassOrder(decision(),'4',f.p);assert.equal(r.state,'verified');assert.equal(r.code,'uncertain_write_reconciled');assert.equal(f.calls.filter(c=>c==='create').length,1)
})
test('unknown write is not retried on replay even when provider lookup is empty',async()=>{
  const f=ports({uncommitted:true,transportFailure:true});assert.equal((await sync.syncPassOrder(decision(),'4',f.p)).state,'uncertain')
  assert.equal((await sync.syncPassOrder(decision(),'4',f.p)).code,'prior_write_not_found_no_replay');assert.equal(f.calls.filter(c=>c==='create').length,1)
})
test('an order without our durable write intent is never adopted or rewritten',async()=>{
  const base=ports();const f=ports({existing:base.record(decision().order)});const r=await sync.syncPassOrder(decision(),'4',f.p)
  assert.equal(r.code,'unowned_existing_order');assert.equal(f.calls.includes('create'),false);assert.equal(f.calls.includes('update'),false)
})
test('refund adjusts only our verified order, preserving source 0 and idempotence',async()=>{
  const base=ports();const f=ports({existing:base.record(decision().order),lease:{writeStarted:true,orderId:'987'}})
  assert.equal((await sync.syncPassOrder(decision(refunded(19900)),'4',f.p)).state,'verified')
  assert.equal(f.calls.filter(c=>c==='update').length,1)
  assert.equal((await sync.syncPassOrder(decision(refunded(19900)),'4',f.p)).state,'verified')
  assert.equal(f.calls.filter(c=>c==='update').length,1)
})
test('a previously refunded payment is never imported as a new order',async()=>{
  const f=ports();const r=await sync.syncPassOrder(decision(refunded(1000)),'4',f.p)
  assert.equal(r.code,'refunded_payment_not_imported');assert.equal(f.calls.includes('create'),false)
})
test('source 1 and recurring payloads are rejected before all ports',async()=>{
  for(const change of [{source:1},{recurring:true}]){const f=ports();const d=decision();Object.assign(d.order,change)
    assert.equal((await sync.syncPassOrder(d,'4',f.p)).state,'blocked');assert.deepEqual(f.calls,[])
    assert.throws(()=>sync.historicalPassOrderPayload(d.order,'4','fixture@example.invalid'))}
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const exports = {}
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/pricing-login-session.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports, URL, AbortController, WeakMap })
const callback = 'https://nested-objects-starter-test123-autumns-projects-246e052c.vercel.app/auth/callback?redirect=%2Fmembership-pricing%3Futm_source%3Dverification'
const token = 'synthetic.payload.signature'
const returned = callback + '&access_token=' + token
const settle = () => new Promise(resolve => setImmediate(resolve))

function harness(request = async () => ({ ok: true, json: async () => ({ success: true, user: { sub: 'fixture-member' } }) })) {
  const listeners = [], calls = [], timers = []
  const sdk = { on: (event, fn) => listeners.push({ event, fn }), setAccessToken: value => calls.push(['sdk', value]) }
  const options = {
    failed: () => calls.push(['failed']), navigate: url => calls.push(['navigate', url]),
    request: async (...args) => { calls.push(['verify', ...args]); return request(...args) },
    schedule: (fn, ms) => { const timer = { fn, ms, active: true }; timers.push(timer); return () => { timer.active = false } },
  }
  const start = () => exports.retainPricingLoginSession(sdk, callback, options)
  const stop = start()
  return { sdk, calls, timers, start, stop, listeners, redirect: url => listeners[0].fn(url) }
}

test('real provider redirect shape is verified before SDK session retention and the unchanged callback navigation', async () => {
  let finish
  const page = harness(() => new Promise(resolve => { finish = resolve }))
  assert.equal(page.redirect(returned), false)
  assert.equal(page.calls.length, 1)
  assert.equal(page.calls[0][1], '/api/auth/session')
  assert.equal(page.calls[0][2].credentials, 'same-origin')
  assert.equal(page.calls[0][2].cache, 'no-store')
  assert.deepEqual(JSON.parse(page.calls[0][2].body), { accessToken: token })
  finish({ ok: true, json: async () => ({ success: true, user: { sub: 'fixture-member' } }) })
  await settle()
  assert.deepEqual(page.calls.slice(1), [['sdk', null], ['sdk', token], ['navigate', returned]])
  assert.ok(page.timers.every(timer => !timer.active))
})

test('unrelated provider redirects and changed return parameters are untouched', () => {
  const page = harness()
  for (const url of ['https://evil.example/auth/callback?access_token='+token,
    returned.replace('/auth/callback','/profile'), returned.replace('utm_source','utm_campaign'),
    returned + '#changed', 'not a URL']) assert.equal(page.redirect(url), undefined)
  assert.equal(page.calls.length, 0)
})

test('missing, duplicate, malformed or oversized tokens cannot create a session or navigate', () => {
  for (const url of [callback, returned+'&access_token=other', callback+'&access_token=bad', callback+'&access_token='+ 'a'.repeat(17000)]) {
    const page = harness()
    assert.equal(page.redirect(url), false)
    assert.deepEqual(page.calls, [['failed']])
  }
})

test('duplicate redirects cannot repeat verification or replace the SDK session during a pending attempt', async () => {
  const page = harness()
  assert.equal(page.redirect(returned), false)
  assert.equal(page.redirect(returned), false)
  await settle()
  assert.equal(page.calls.filter(call=>call[0]==='verify').length, 1)
  assert.equal(page.calls.filter(call=>call[0]==='navigate').length, 1)
})

test('blocked SDK storage preserves the already verified site login so the plan button can recover', async () => {
  const page = harness()
  page.sdk.setAccessToken = () => { throw Error('Storage access denied') }
  page.redirect(returned); await settle()
  assert.deepEqual(page.calls.map(call=>call[0]), ['verify','navigate'])
  assert.equal(page.calls.at(-1)[1],returned)
})

test('rejected, malformed and unavailable verification never retain a token or follow the callback', async () => {
  for (const request of [async()=>({ok:false,json:async()=>({success:true,user:{sub:'fixture'}})}),
    async()=>({ok:true,json:async()=>({success:true})}), async()=>{throw Error('network failure')},
    async()=>({ok:true,json:async()=>{throw Error('invalid response')}})]) {
    const page = harness(request); page.redirect(returned); await settle()
    assert.deepEqual(page.calls.map(call=>call[0]), ['verify','failed'])
  }
})

test('unmount or identity change cancels a pending verification without later token retention', async () => {
  let finish
  const page = harness(() => new Promise(resolve=>{finish=resolve}))
  page.redirect(returned); page.stop()
  finish({ok:true,json:async()=>({success:true,user:{sub:'fixture-member'}})})
  await settle()
  assert.deepEqual(page.calls.map(call=>call[0]), ['verify'])
  assert.equal(page.redirect(returned), undefined)
})

test('the verification deadline fails closed and repeated installs keep one SDK listener', async () => {
  const page = harness((url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('aborted')))))
  page.redirect(returned)
  assert.equal(page.timers[0].ms, 8000)
  page.timers[0].fn(); await settle()
  assert.deepEqual(page.calls.map(call=>call[0]), ['verify','failed'])
  page.stop(); const secondStop=page.start()
  assert.equal(page.listeners.length,1)
  secondStop()
  assert.equal(page.redirect(returned),undefined)
})

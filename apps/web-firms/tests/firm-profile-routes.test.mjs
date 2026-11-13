import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { NextRequest,NextResponse } from 'next/server.js'
const root=new URL('../',import.meta.url)
const cache=new Map()
const state={ identity:{accountUid:'account1',personUid:'person01',isPrimary:true}, saved:null, calls:0, error:null }
globalThis.__firmProfileRouteFixture=state
function data(source){return 'data:text/javascript;base64,'+Buffer.from(source).toString('base64')}
function compile(path) {
  if(cache.has(path)) return cache.get(path)
  let source=ts.transpileModule(fs.readFileSync(new URL(path,root),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
  source=source.replace(/from ['"]next\/server['"]/g,'from '+JSON.stringify(import.meta.resolve('next/server.js')))
  source=source.replace(/from ['"]@\/lib\/firm-profile\/([^'"]+)['"]/g,(_,name)=>'from '+JSON.stringify(name==='server'?server:compile('lib/firm-profile/'+name+'.ts')))
  source=source.replace(/from ['"]\.\/([^'"]+)['"]/g,(_,name)=>'from '+JSON.stringify(compile('lib/firm-profile/'+name+'.ts')))
  const url=data(source);cache.set(path,url);return url
}
const contracts=compile('lib/firm-profile/contracts.ts')
const {FirmProfileError}=await import(contracts)
const server=data(`import {FirmProfileError} from ${JSON.stringify(contracts)};
export const FIRM_SESSION_COOKIE="__Host-no_firm_session",FIRM_STATE_COOKIE="__Host-no_firm_login";
export const firmsOrigin=()=>"https://firm.example.test"; export const requireEnabled=()=>{};
export async function firmSession(){ const s=globalThis.__firmProfileRouteFixture;s.calls++;if(s.error)throw s.error; return s.identity}
export async function readFirmProfile(){ const s=globalThis.__firmProfileRouteFixture;if(s.error)throw s.error;return {profile:s.saved,canEdit:true}}
export async function saveFirmProfile(identity,profile,revision){ const s=globalThis.__firmProfileRouteFixture;s.saved={identity,profile,revision};return {profile:{...profile,revision:revision+1},canEdit:true}}
export async function verifyFirmToken(token){const s=globalThis.__firmProfileRouteFixture;s.calls++;if(s.error)throw s.error; if(token!=="fixture-token")throw new FirmProfileError(401,"Invalid");return {identity:s.identity,expiresAt:Math.floor(Date.now()/1000)+1200}}
`)
const api=await import(compile('app/api/firm-profile/route.ts'))
const start=await import(compile('app/auth/start/route.ts'))
const callback=await import(compile('app/auth/callback/route.ts'))
const logout=await import(compile('app/auth/logout/route.ts'))
const profile={legalName:'Fixture',displayName:'Fixture',website:'',address:'',primaryContactName:'Fixture',primaryContactEmail:'fixture@example.test',serviceZips:['30301'],inspectionTypes:[],requirements:''}
const put=(body,origin='https://firm.example.test')=>new NextRequest('https://firm.example.test/api/firm-profile',{method:'PUT',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)})
test('privacy headers cover only firm login, private profile/workspace, auth and profile API',async()=>{
  const config=createRequire(import.meta.url)('../next.config.js')
  const routes=await config.headers()
  assert.deepEqual(routes.map(route=>route.source),['/login','/profile/:path*','/workspace/:path*','/auth/:path*','/api/firm-profile'])
  for(const route of routes) {
    const headers=Object.fromEntries(route.headers.map(header=>[header.key,header.value]))
    assert.equal(headers['Referrer-Policy'],'no-referrer')
    assert.equal(headers['X-Robots-Tag'],'noindex, nofollow')
    assert.equal(headers['Cache-Control'],'private, no-store')
  }
})
test('actual profile route protects anonymous reads, CSRF and caller-supplied tenant identities',async()=>{
  state.error=new FirmProfileError(401,'Sign in');let response=await api.GET();assert.equal(response.status,401);assert.match(response.headers.get('cache-control'),/no-store/)
  state.error=null;state.calls=0;response=await api.PUT(put({profile,revision:0},'https://attacker.example.test'));assert.equal(response.status,403);assert.equal(state.calls,0)
  response=await api.PUT(put({profile,revision:0,accountUid:'account2'}));assert.equal(response.status,400)
  response=await api.PUT(put({profile:{...profile,accountUid:'account2'},revision:0}));assert.equal(response.status,400)
  response=await api.PUT(put({profile,revision:0}));assert.equal(response.status,200);assert.equal(state.saved.identity.accountUid,'account1')
  state.error=new Error('sensitive provider detail');response=await api.GET();assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/sensitive provider detail/);state.error=null
})
test('firm login callback requires same-browser state and clears token from redirect with secure cookie',async()=>{
  state.error=null
  const begin=await start.GET()
  const provider=new URL(begin.headers.get('location'))
  assert.equal(provider.origin,'https://nested-objects.outseta.com')
  const destination=new URL(provider.searchParams.get('authenticationCallbackUrl'))
  assert.equal(destination.origin,'https://firm.example.test')
  const nonce=begin.cookies.get('__Host-no_firm_login').value
  destination.searchParams.set('access_token','fixture-token')
  state.calls=0
  let result=await callback.GET(new NextRequest(destination))
  assert.match(result.headers.get('location'),/notice=verification/);assert.equal(state.calls,0)
  result=await callback.GET(new NextRequest(destination,{headers:{cookie:'__Host-no_firm_login='+nonce}}))
  assert.equal(result.headers.get('location'),'https://firm.example.test/profile')
  assert.equal(result.cookies.get('__Host-no_firm_session').value,'fixture-token')
  assert.match(result.headers.get('set-cookie'),/HttpOnly/);assert.match(result.headers.get('set-cookie'),/Secure/);assert.match(result.headers.get('set-cookie'),/SameSite=lax/)
  assert.equal(result.headers.get('referrer-policy'),'no-referrer')
  assert.match(result.headers.get('cache-control'),/no-store/)
  assert.doesNotMatch(result.headers.get('location'),/fixture-token|state=/)
  destination.searchParams.set('access_token','a'.repeat(3501))
  state.calls=0
  result=await callback.GET(new NextRequest(destination,{headers:{cookie:'__Host-no_firm_login='+nonce}}))
  assert.match(result.headers.get('location'),/notice=session-size/)
  assert.equal(result.cookies.get('__Host-no_firm_session').maxAge,0)
  assert.equal(state.calls,0)
})
test('maximum accepted token serializes comfortably below the browser per-cookie byte limit',()=>{
  const response=NextResponse.json({})
  response.cookies.set('__Host-no_firm_session','a'.repeat(3500),{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:3600})
  assert.ok(Buffer.byteLength(response.headers.get('set-cookie'),'utf8')<4096)
})
test('firm logout requires same-origin POST and clears only the firm session cookies',async()=>{
  const target='https://firm.example.test/auth/logout'
  let result=await logout.POST(new NextRequest(target,{method:'POST',headers:{origin:'https://attacker.example.test'}}))
  assert.equal(result.status,403)
  result=await logout.POST(new NextRequest(target,{method:'POST',headers:{origin:'https://firm.example.test'}}))
  assert.equal(result.status,303)
  assert.equal(result.headers.get('location'),'https://firm.example.test/login')
  assert.equal(result.cookies.get('__Host-no_firm_session').maxAge,0)
  assert.equal(result.cookies.get('__Host-no_firm_login').maxAge,0)
})

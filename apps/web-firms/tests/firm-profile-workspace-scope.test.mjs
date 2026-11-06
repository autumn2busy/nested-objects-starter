import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const root=new URL('../lib/firm-profile/',import.meta.url)
const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64')
const transpile=file=>ts.transpileModule(fs.readFileSync(new URL(file,root),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const contracts=data(transpile('contracts.ts'))
const {FirmProfileError}=await import(contracts)
const state={calls:[],error:null,profile:null}
globalThis.__firmScopeFixture=state
const server=data(`export async function firmSession(){const s=globalThis.__firmScopeFixture;s.calls.push('session');if(s.error)throw s.error;return {accountUid:'fixture-account',personUid:'private-person'}}
export async function readFirmProfile(identity){const s=globalThis.__firmScopeFixture;s.calls.push(identity.accountUid);return {profile:s.profile,canEdit:false}}`)
const source=transpile('workspace-scope.ts').replace(/import 'server-only';?/, '').replace("'./server'",JSON.stringify(server)).replace("'./contracts'",JSON.stringify(contracts))
const {readAuthorizedFirmWorkspaceScope}=await import(data(source))
const fixture=()=>({id:'fixture-profile',revision:3,serviceZips:['28801'],inspectionTypes:['Exterior'],primaryContactEmail:'private@example.test',requirements:'private',pilotStage:'pilot_ready'})
test('workspace scope derives tenant from session and exposes only copied read-only scope',async()=>{
 state.calls=[];state.error=null;state.profile=fixture()
 const result=await readAuthorizedFirmWorkspaceScope({accountUid:'attacker'})
 assert.deepEqual(state.calls,['session','fixture-account'])
 assert.deepEqual(result,{accountUid:'fixture-account',profileId:'fixture-profile',profileRevision:3,serviceZips:['28801'],inspectionTypes:['Exterior']})
 assert.ok(Object.isFrozen(result));assert.ok(Object.isFrozen(result.serviceZips));assert.ok(Object.isFrozen(result.inspectionTypes))
 state.profile.serviceZips.push('37660');assert.deepEqual(result.serviceZips,['28801'])
})
test('workspace scope preserves anonymous, disabled and revoked denials before profile reads',async()=>{
 for(const status of [401,403,503]){state.calls=[];state.error=new FirmProfileError(status,'denied');await assert.rejects(readAuthorizedFirmWorkspaceScope(),error=>error.status===status);assert.deepEqual(state.calls,['session'])}
 state.error=null
})
test('unsaved profile returns no scope; malformed stored revision and service scope fail closed',async()=>{
 state.profile=null;assert.equal(await readAuthorizedFirmWorkspaceScope(),null)
 for(const patch of [{revision:-1},{revision:0.5},{revision:NaN},{id:''},{serviceZips:['bad']},{serviceZips:null},{inspectionTypes:[null]}]){state.profile={...fixture(),...patch};await assert.rejects(readAuthorizedFirmWorkspaceScope(),error=>error.status===503)}
})

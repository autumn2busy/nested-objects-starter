import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const root = new URL('../lib/firm-profile/',import.meta.url)
const compiled = new Map()
function load(name) {
  if(compiled.has(name)) return compiled.get(name)
  let source = ts.transpileModule(fs.readFileSync(new URL(name+'.ts',root),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
  source = source.replace(/from ['"]\.\/([^'"]+)['"]/g,(_,file)=>'from '+JSON.stringify(load(file)))
  const url='data:text/javascript;base64,'+Buffer.from(source).toString('base64')
  compiled.set(name,url); return url
}
const { authorizeFirm } = await import(load('access'))
const { parseProfile,parseRevision } = await import(load('validation'))
const claims = { sub:'person01','outseta:accountUid':'account1','outseta:subscriptionUid':'subscr01','outseta:planUid':'wmjGbGQV','outseta:isPrimary':'1' }
const account = { Uid:'account1',IsDemo:false,AccountStage:3,PrimaryContact:{Uid:'person01'},CurrentSubscription:{Uid:'subscr01',Plan:{Uid:'wmjGbGQV'},Account:{Uid:'account1'}},PersonAccount:[{Person:{Uid:'person01'}}] }
const profile = {legalName:'Fixture Firm',displayName:'Fixture',website:'https://example.test',address:'',primaryContactName:'Fixture Contact',primaryContactEmail:'fixture@example.test',serviceZips:['30301','30301'],inspectionTypes:['Occupancy'],requirements:'Exterior only'}
test('both firm plans accept a fresh matching active account; addon and inspector plans fail',()=>{
  for(const plan of ['wmjGbGQV','A93NbYQ0']) assert.equal(authorizeFirm({...claims,'outseta:planUid':plan},{...account,CurrentSubscription:{...account.CurrentSubscription,Plan:{Uid:plan}}}).accountUid,'account1')
  for(const plan of ['vW5aDXW4','proplan1','unknown1']) assert.throws(()=>authorizeFirm({...claims,'outseta:planUid':plan},account),/firm plan/)
})
test('missing, cancelled, trial, inactive, stale subscription and cross-account identity fail closed',()=>{
  for(const stage of [undefined,0,1,2,4,8]) assert.throws(()=>authorizeFirm(claims,{...account,AccountStage:stage}))
  assert.throws(()=>authorizeFirm(claims,{...account,IsDemo:true}))
  assert.throws(()=>authorizeFirm(claims,{...account,PersonAccount:[]}))
  assert.throws(()=>authorizeFirm(claims,{...account,Uid:'account2'}))
  assert.throws(()=>authorizeFirm(claims,{...account,CurrentSubscription:{...account.CurrentSubscription,Uid:'subscr02'}}))
  assert.throws(()=>authorizeFirm(claims,{...account,CurrentSubscription:{...account.CurrentSubscription,EndDate:'2020-01-01T00:00:00'}}))
  assert.throws(()=>authorizeFirm(claims,{...account,CurrentSubscription:{...account.CurrentSubscription,EndDate:'invalid'}}))
})
test('profile fields normalize without trusting tenant, role, billing, or pilot stage input',()=>{
  assert.deepEqual(parseProfile(profile).serviceZips,['30301'])
  for(const key of ['id','accountUid','personUid','role','pilotStage','billingReference','revision']) assert.throws(()=>parseProfile({...profile,[key]:'forged'}),/Unrecognized/)
  for(const value of ['javascript:alert(1)','http://example.test','https://user:pass@example.test']) assert.throws(()=>parseProfile({...profile,website:value}))
  assert.throws(()=>parseProfile({...profile,serviceZips:['3030']}))
  assert.throws(()=>parseProfile({...profile,legalName:''}))
  assert.throws(()=>parseProfile({...profile,inspectionTypes:[null]}))
  for(const value of [null,-1,0.5,'1',NaN]) assert.throws(()=>parseRevision(value))
  assert.equal(parseRevision(0),0)
})
test('stale primary claim, missing current primary and different primary never authorize writes',()=>{
  assert.throws(()=>authorizeFirm(claims,{...account,PrimaryContact:undefined}),/Current firm role/)
  assert.throws(()=>authorizeFirm(claims,{...account,PrimaryContact:{Uid:'person02'}}),/Current firm role/)
  assert.throws(()=>authorizeFirm({...claims,'outseta:isPrimary':'0'},account),/Current firm role/)
  const staff=authorizeFirm({...claims,sub:'staff001','outseta:isPrimary':'0'},{...account,PersonAccount:[...account.PersonAccount,{Person:{Uid:'staff001'}}]})
  assert.equal(staff.isPrimary,false)
})

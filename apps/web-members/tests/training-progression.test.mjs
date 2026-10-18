import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
const require = createRequire(import.meta.url)
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const jsxRuntime = require('react/jsx-runtime')
function load(file, imports = {}, globals = {}) {
  const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, console, Date, Set, Map, JSON, URL, ...globals, require(name) { if (name in imports) return imports[name]; throw Error('Unexpected import '+name) } })
  return exports
}
const plan = load('../lib/plan-config.ts')
const access = load('../lib/training-access.ts', { './plan-config': plan })
const modules = [1,2,3].map(n => ({ id: 'module-'+n, slug:'module-'+n, module_number:n, requires_previous_module:n>1, is_active:true }))
const blank = { modules, completedModuleIds:[], waivedModuleIds:[] }
const user = { sub:'person-a', 'outseta:accountUid':'account-a', 'outseta:planUid':plan.PLAN_UIDS.PRO }
const profile = { id:'profile-a', user_id:'legacy-a', outseta_person_uid:'person-a', outseta_account_id:'account-a' }
const now = Date.parse('2026-10-18T12:00:00Z')
const waiver = { profile_id:'profile-a', outseta_person_uid:'person-a', outseta_account_uid:'account-a', module_id:'module-2', prerequisite_module_id:'module-1', approved_at:'2026-10-18T11:00:00Z', expires_at:null, revoked_at:null }
function db(options={}) {
  const tables = { training_modules:modules, profiles:[profile], quiz_attempts:[], training_prerequisite_waivers:[], training_progress:[], ...options.tables }
  const calls=[]
  return { calls, tables, from(table) {
    const filters=[]
    const q={
      select(){return q}, eq(k,v){filters.push(row=>row[k]===v);return q}, in(k,v){filters.push(row=>v.includes(row[k]));return q}, is(k,v){filters.push(row=>row[k]===v);return q},
      or(expression){const parts=expression.split(',').map(x=>x.split('.eq.'));filters.push(row=>parts.some(([k,v])=>row[k]===v));return q},
      limit(){return q}, order(){return q},
      then(resolve){calls.push(table);resolve({ data:(tables[table]||[]).filter(row=>filters.every(f=>f(row))), error:options.fail===table?{code:'TEST_FAILURE'}:null })},
    }; return q
  } }
}
test('Pro with lessons only is not granted assessment completion; saved pass opens Module 2',()=>{
  assert.equal(access.canOpenTrainingModule(plan.PLAN_UIDS.PRO, modules[1], blank),false)
  assert.equal(access.canOpenTrainingModule(plan.PLAN_UIDS.PRO, modules[1], {...blank,completedModuleIds:['module-1']}),true)
})
test('Module 2 waiver opens only that module and never counts as a passed quiz',async()=>{
  const state=await access.readTrainingAccess(db({tables:{training_prerequisite_waivers:[waiver]}}),user,now)
  assert.deepEqual([...state.completedModuleIds],[])
  assert.equal(access.canOpenTrainingModule(plan.PLAN_UIDS.PRO,modules[1],state),true)
  assert.equal(access.canOpenTrainingModule(plan.PLAN_UIDS.PRO,modules[2],state),false)
})
test('Free and unknown plans cannot use a waiver or historical pass to open Module 2',()=>{
  const state={...blank,completedModuleIds:['module-1','module-2'],waivedModuleIds:['module-2']}
  for(const planUid of [plan.PLAN_UIDS.FREE,null,'unknown']) assert.equal(access.canOpenTrainingModule(planUid,modules[1],state),false)
  assert.equal(access.canOpenTrainingModule(plan.PLAN_UIDS.FREE,modules[0],state),true)
})
for(const [name,change] of [
  ['another person',{outseta_person_uid:'person-b'}],['another profile',{profile_id:'profile-b'}],['another account',{outseta_account_uid:'account-b'}],
  ['expired',{expires_at:'2026-10-18T11:59:59Z'}],['revoked',{revoked_at:'2026-10-18T11:59:59Z'}],['not yet approved',{approved_at:'2026-10-18T12:00:01Z'}],
  ['wrong prerequisite',{prerequisite_module_id:'module-3'}],['invalid expiry',{expires_at:'invalid'}],
]) test('waiver rejected: '+name,async()=>{
  const state=await access.readTrainingAccess(db({tables:{training_prerequisite_waivers:[{...waiver,...change}]}}),user,now)
  assert.deepEqual([...state.waivedModuleIds],[])
})
test('waiver storage unavailable preserves earned progression without waiving access',async()=>{
  const state=await access.readTrainingAccess(db({fail:'training_prerequisite_waivers',tables:{quiz_attempts:[{user_id:'person-a',module_id:'module-1',passed:true}]}}),user,now)
  assert.deepEqual([...state.waivedModuleIds],[])
  assert.equal(access.canOpenTrainingModule(plan.PLAN_UIDS.PRO,modules[1],state),true)
})
test('canonical, legacy and profile-linked passing attempts are unioned even with a canonical pass',async()=>{
  const state=await access.readTrainingAccess(db({tables:{quiz_attempts:[
    {user_id:'person-a',module_id:'module-3',passed:true},{user_id:'legacy-a',module_id:'module-2',passed:true},
    {profile_id:'profile-a',user_id:null,module_id:'module-1',passed:true},{profile_id:'profile-other',user_id:'other',module_id:'outside',passed:true},
  ]}}),user,now)
  assert.deepEqual([...state.completedModuleIds].sort(),['module-1','module-2','module-3'])
})
test('repeated identity reads return the durable waiver, while another member receives none',async()=>{
  const database=db({tables:{training_prerequisite_waivers:[waiver]}})
  for(let n=0;n<3;n++) assert.deepEqual([...(await access.readTrainingAccess(database,{...user},now)).waivedModuleIds],['module-2'])
  const other=await access.readTrainingAccess(database,{sub:'person-b','outseta:accountUid':'account-b'},now)
  assert.deepEqual([...other.waivedModuleIds],[])
})
test('ambiguous stable identity and failed quiz reads are unavailable, not empty success',async()=>{
  await assert.rejects(access.readTrainingAccess(db({tables:{profiles:[profile,{...profile,id:'another'}]}}),user,now))
  await assert.rejects(access.readTrainingAccess(db({fail:'quiz_attempts'}),user,now))
})
test('actual progress GET reads the complete saved union and returns waiver separately',async()=>{
  const database=db({tables:{quiz_attempts:[{profile_id:profile.id,module_id:'module-1',passed:true}],training_prerequisite_waivers:[waiver]}})
  const route=load('../app/api/training/progress/route.ts',{
    'next/server':{NextResponse:{json:(body,init)=>({body,status:init?.status||200})}},'@/lib/auth-server':{getCurrentUser:async()=>user,getOutsetaUserId:u=>u.sub},
    '@/lib/supabase-admin':{createServiceRoleClient:()=>database},'@/lib/training-access':access,'@/lib/training-identity':{},
  })
  const response=await route.GET({url:'https://fixture.invalid/api/training/progress'})
  assert.equal(response.status,200);assert.deepEqual([...response.body.completedModuleIds],['module-1']);assert.deepEqual([...response.body.waivedModuleIds],['module-2'])
})
test('actual server layout withholds Free Module 2 and admits only eligible saved pass or exact waiver',async()=>{
  for(const scenario of [
    {plan:plan.PLAN_UIDS.PRO,waivers:[waiver],allowed:true}, {plan:plan.PLAN_UIDS.FREE,waivers:[waiver],allowed:false},
    {plan:plan.PLAN_UIDS.PRO,waivers:[],allowed:false},
  ]) {
    const gate=load('../app/challenges/[moduleId]/layout.tsx',{'react/jsx-runtime':jsxRuntime,'next/link':{default:props=>React.createElement('a',props)},
      '@/lib/auth-server':{getCurrentUser:async()=>({...user,'outseta:planUid':scenario.plan})},'@/lib/supabase-admin':{createServiceRoleClient:()=>db({tables:{training_prerequisite_waivers:scenario.waivers}})},'@/lib/training-access':access,
    })
    const html=renderToStaticMarkup(await gate.default({children:React.createElement('p',null,'Protected Module 2'),params:{moduleId:'module-2'}}))
    assert.equal(html.includes('Protected Module 2'),scenario.allowed)
  }
})
const receipt=load('../lib/training-quiz-receipt.ts')
test('quiz client requires matching persisted receipt; HTTP failure and malformed success stay unsaved',async()=>{
  const input={module_id:'module-1',score:93,total_questions:15}
  for(const response of [{status:500,json:async()=>({success:true})},{status:200,json:async()=>({success:false})},{status:200,json:async()=>({success:true,passed:true,score:93,completedModuleIds:[]})}]) {
    assert.equal((await receipt.saveTrainingQuiz(input,async()=>response)).saved,false)
  }
  assert.equal((await receipt.saveTrainingQuiz(input,async()=>({status:200,json:async()=>({success:true,passed:true,score:93,completedModuleIds:['module-1']})}))).saved,true)
})
test('failed 73 percent result can save without turning into a pass',async()=>{
 const result=await receipt.saveTrainingQuiz({module_id:'module-1',score:73,total_questions:15},async()=>({status:200,json:async()=>({success:true,passed:false,score:73})}))
 assert.equal(result.saved,true);assert.equal(result.passed,false)
})
test('waiver migration permits only service-role access and contains no live member seed',async()=>{
  const { PGlite }=require('@electric-sql/pglite');const pg=new PGlite()
  try {
    await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE TABLE public.profiles(id uuid primary key); CREATE TABLE public.training_modules(id uuid primary key);')
    const migration=readFileSync(new URL('../../../supabase/migrations/20261018133810_training_prerequisite_waivers.sql',import.meta.url),'utf8')
    await pg.exec(migration)
    const {rows}=await pg.query("SELECT has_table_privilege('anon','public.training_prerequisite_waivers','SELECT') as anon_read, has_table_privilege('authenticated','public.training_prerequisite_waivers','INSERT') as member_write, has_table_privilege('service_role','public.training_prerequisite_waivers','SELECT') as server_read")
    assert.deepEqual(rows,[{anon_read:false,member_write:false,server_read:true}])
    assert.equal((await pg.query('SELECT count(*)::int as count FROM public.training_prerequisite_waivers')).rows[0].count,0)
  } finally { await pg.close() }
})


test('actual quiz POST enforces plan and per-module waiver before persistence, and derives pass from score', async()=>{
 for(const scenario of [
  {tier:plan.PLAN_UIDS.FREE,module:'module-2',waivers:['module-2'],status:403},
  {tier:plan.PLAN_UIDS.PRO,module:'module-3',waivers:['module-2'],status:403},
  {tier:plan.PLAN_UIDS.PRO,module:'module-2',waivers:[],status:403},
  {tier:plan.PLAN_UIDS.PRO,module:'module-2',waivers:['module-2'],status:200},
 ]) {
  const saved=[];
  const route=load('../app/api/training/quiz-complete/route.ts',{
   'next/server':{NextResponse:{json:(body,init)=>({body,status:init?.status||200})}},
   '@/lib/auth-server':{getCurrentUser:async()=>({...user,'outseta:planUid':scenario.tier}),getOutsetaUserId:u=>u.sub},
   '@/lib/supabase-admin':{createServiceRoleClient:()=>({})},
   '@/lib/training-access':{canOpenTrainingModule:access.canOpenTrainingModule,readTrainingAccess:async()=>({...blank,waivedModuleIds:scenario.waivers})},
   '@/lib/training-identity':{resolveTrainingIdentity:async()=>({profile,canonicalUserId:user.sub}),runTrainingUserIdMigrationOncePerRuntime:async()=>{}},
   './quiz-complete-service':{persistQuizCompletion:async(input)=>{saved.push(input);return {ok:true,attemptNumber:1}}},
  });
  const result=await route.POST({json:async()=>({module_id:scenario.module,score:73,passed:true,total_questions:15})});
  assert.equal(result.status,scenario.status);assert.equal(saved.length,scenario.status===200?1:0);
  if(saved.length){assert.equal(saved[0].passed,false);assert.equal(result.body.passed,false);assert.equal(result.body.score,73)}
 }
});
test('lesson-only 100 percent displays lessons and assessment requirement separately',()=>{
 const lessons=Array.from({length:6},(_,i)=>({id:'lesson-'+i,lesson_number:i+1,title:'Lesson '+(i+1),estimated_minutes:5}));
 const states=[{...modules[0],title:'Orientation'},lessons,false,null,'overview',null,new Set(lessons.map(x=>x.id)),false,'idle',null];let cursor=0;
 const fakeReact={...React,useState:initial=>[cursor<states.length?states[cursor++]:initial,()=>{}],useEffect:()=>{},useRef:initial=>({current:initial})};
 const page=load('../app/challenges/[moduleId]/page.tsx',{
  react:fakeReact,'react/jsx-runtime':jsxRuntime,'next/navigation':{useParams:()=>({moduleId:'module-1'})},'next/link':{default:props=>React.createElement('a',props)},
  '@/utils/supabase/client':{createClient:()=>({})},'@/components/auth-provider':{useAuth:()=>({user,isAuthenticated:true,isLoading:false,hasAccess:()=>true})},
  'lucide-react':require('lucide-react'), '@/components/training/FlashcardDeck':{default:()=>null},'@/components/training/IncomeCalculator':{default:()=>null},
  '@/components/training/InteractiveScenario':{default:()=>null},'@/components/training/DynamicQuiz':{default:()=>null},'@/lib/training-quiz-receipt':receipt,
 });
 const html=renderToStaticMarkup(page.default());assert.match(html,/100% of lessons complete/);assert.match(html,/Assessment required: score 80% or higher/);assert.doesNotMatch(html,/Assessment Passed|Assessment passed and saved/);
});

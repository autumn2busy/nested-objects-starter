import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
const require=createRequire(import.meta.url), React=require('react'), jsx=require('react/jsx-runtime')
const {renderToStaticMarkup}=require('react-dom/server')
function load(path, imports={}) {
 const exports={};const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText
 vm.runInNewContext(code,{exports,process:{env:{NEXT_PUBLIC_OUTSETA_DIRECTORY_PASS_PLAN_UID:'PassTest1'}},require(name){if(name==='react/jsx-runtime')return jsx;if(name==='lucide-react')return require(name);if(name in imports)return imports[name];throw Error('Unexpected import '+name)}});return exports
}
const Link={default:({children,...props})=>React.createElement('a',props,children)}
const role=load('../app/roles/role-aeo-content.tsx',{'next/link':Link,'@/lib/seo':{SITE_URL:'https://fixture.invalid',getFAQPageSchema:value=>value}})
test('every role guide renders working plan/tool destinations without claiming enabled tools are disabled',()=>{
 for(const [name,content]of Object.entries(role.roleAeoContent)){
  const html=renderToStaticMarkup(React.createElement(role.RoleAeoSection,{content}))
  assert.match(html,/href="\/membership-pricing"/,name)
  assert.match(html,/href="\/hiring-firms"/,name)
  assert.doesNotMatch(html,/Calculation remains disabled|Saving remains disabled|execution still disabled/i,name)
 }
})
let planUid='PassTest1'
const plans=load('../lib/plan-config.ts')
const sidebar=load('../app/inspector-resource-center/SmartSidebar.tsx',{'next/link':Link,'@/components/auth-provider':{useAuth:()=>({planUid,isAuthenticated:true})},'@/lib/plan-config':plans})
test('Directory Pass recommendations describe directory access and a Pro upgrade rather than claiming training entitlement',()=>{
 const component=sidebar.SmartSidebar??sidebar.default
 const html=renderToStaticMarkup(React.createElement(component))
 assert.match(html,/Directory Pass/)
 assert.match(html,/12-month directory access/)
 assert.match(html,/does not include the training library or Pro tools/)
 assert.doesNotMatch(html,/You have access to the training center|Upgrade to Elite/)
})
test('Pro recommendations retain current tools and do not promote the closed Elite offer',()=>{
 planUid=plans.PLAN_UIDS.PRO
 const html=renderToStaticMarkup(React.createElement(sidebar.SmartSidebar??sidebar.default))
 assert.match(html,/Your Pro membership includes/)
 assert.doesNotMatch(html,/Elite members get partner referrals|Upgrade to Elite/)
})

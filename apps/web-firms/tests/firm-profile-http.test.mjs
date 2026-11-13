import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const base=new URL('../lib/firm-profile/',import.meta.url)
function moduleUrl(name) {
  let code=ts.transpileModule(fs.readFileSync(new URL(name+'.ts',base),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
  code=code.replace(/from ['"]\.\/([^'"]+)['"]/g,(_,file)=>'from '+JSON.stringify(moduleUrl(file)))
  return 'data:text/javascript;base64,'+Buffer.from(code).toString('base64')
}
const {readBoundedJson}=await import(moduleUrl('http'))
const request=(body,headers={})=>new Request('https://firm.example.test/api/firm-profile',{method:'PUT',body,headers,duplex:'half'})
test('profile JSON is decoded with a real byte limit before collecting unbounded request data',async()=>{
  assert.deepEqual(await readBoundedJson(request('{"revision":0}')),{revision:0})
  await assert.rejects(readBoundedJson(request('x'.repeat(20001))),/too large/)
  await assert.rejects(readBoundedJson(request('{}',{'content-length':'999999'})),/too large/)
  await assert.rejects(readBoundedJson(request('not-json')),/Invalid profile/)
  const stream=new ReadableStream({start(controller){ controller.enqueue(new Uint8Array(10001));controller.enqueue(new Uint8Array(10001));controller.close() }})
  await assert.rejects(readBoundedJson(request(stream)),/too large/)
})

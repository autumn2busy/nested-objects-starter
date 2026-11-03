import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
import { SignJWT,generateKeyPair,exportJWK,createLocalJWKSet } from 'jose'
let source=ts.transpileModule(fs.readFileSync(new URL('../lib/firm-profile/token.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
source=source.replace("from 'jose'","from "+JSON.stringify(import.meta.resolve('jose')))
const { verifyFirmJwt, OUTSETA_ISSUER }=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
const {privateKey,publicKey}=await generateKeyPair('RS256')
const jwk={...await exportJWK(publicKey),kid:'fixture-key',alg:'RS256'}
const resolver=createLocalJWKSet({keys:[jwk]})
async function signed({issuer=OUTSETA_ISSUER,audience=OUTSETA_ISSUER,expires='1h',subject='person01'}={}) {
  return new SignJWT({'outseta:accountUid':'account1'}).setProtectedHeader({alg:'RS256',kid:'fixture-key'}).setIssuedAt().setSubject(subject).setIssuer(issuer).setAudience(audience).setExpirationTime(expires).sign(privateKey)
}
test('real RSA JWT verification accepts valid provider-scoped fixture',async()=>assert.equal((await verifyFirmJwt(await signed(),resolver)).sub,'person01'))
test('tampered signature, wrong issuer/audience, expired and unsigned token are rejected',async()=>{
  for(const options of [{issuer:'https://other.example.test'},{audience:'https://other.example.test'},{expires:'-1h'}]) await assert.rejects(verifyFirmJwt(await signed(options),resolver))
  const token=await signed()
  const pieces=token.split('.')
  pieces[1]=Buffer.from(JSON.stringify({sub:'attacker','iss':OUTSETA_ISSUER,aud:OUTSETA_ISSUER,exp:Math.floor(Date.now()/1000)+1000})).toString('base64url')
  await assert.rejects(verifyFirmJwt(pieces.join('.'),resolver))
  await assert.rejects(verifyFirmJwt(Buffer.from('{"alg":"none"}').toString('base64url')+'.'+pieces[1]+'.',resolver))
})

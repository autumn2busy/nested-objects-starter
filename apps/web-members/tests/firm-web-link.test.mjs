import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
const exports = {}
const code = ts.transpileModule(readFileSync(new URL('../lib/firm-web-link.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
vm.runInNewContext(code, { exports, URL })
const { normalizeFirmWebLink } = exports

test('official website and application routes retain their path, query and secure protocol', () => {
  assert.equal(normalizeFirmWebLink(' https://www.signwithjot.com/sign-up '), 'https://www.signwithjot.com/sign-up')
  assert.equal(normalizeFirmWebLink('www.example.com/apply?type=vendor'), 'https://www.example.com/apply?type=vendor')
  assert.equal(normalizeFirmWebLink('http://example.com/application'), 'http://example.com/application')
})
test('emails, prose, credentials, unsafe schemes and internal hosts cannot masquerade as firm websites', () => {
  for (const value of ['vendor@example.invalid', 'reach out to Nested Objects', 'javascript:alert(1)', 'mailto:vendor@example.invalid', 'https://user:password@example.com', 'https://localhost/', 'http://127.0.0.1/', 'http://10.0.0.1/', 'https://169.254.169.254/', 'https://example.internal/', '', null]) assert.equal(normalizeFirmWebLink(value), null, String(value))
})

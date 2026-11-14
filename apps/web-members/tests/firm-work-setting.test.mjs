import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as jsxRuntime from 'react/jsx-runtime'

function load(path, imports = {}) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require(name) {
    if (name === 'react/jsx-runtime') return jsxRuntime
    if (name in imports) return imports[name]
    throw new Error('Unexpected import: ' + name)
  } })
  return exports
}
const work = load('../lib/firm-work-setting.ts')
const notes = 'Official-site research 2026-10-12. Website: https://example.invalid/ Contractor entry point. Confidence: High. Scope: no application submitted.'

test('only actual setting categories and known legacy aliases are displayed', () => {
  for (const [input, expected] of [['Field', 'Field Operations'], ['Remote', 'Remote / Desk'], ['Field + Remote', 'Field + Desk'], ['Remote + On-Site', 'On-Site + Remote'], [' field + drone ', 'Field + Drone']]) {
    assert.equal(work.normalizeFirmWorkSetting(input), expected)
  }
  for (const input of [notes, 'Research/cleanup: Field Operations', 'Remote hiring research', 'https://field.example', 'unknown', '', null, undefined]) {
    assert.equal(work.normalizeFirmWorkSetting(input), null)
  }
})

test('work-setting filters match exact category aliases, never research substrings or raw input', () => {
  assert.equal(work.firmWorkSettingFilter('Remote/Desk'), 'source.eq.Remote / Desk,source.eq.Remote/Desk,source.eq.Remote')
  assert.equal(work.firmWorkSettingFilter(notes), null)
  assert.equal(work.firmWorkSettingFilter('Remote),id.not.is.null'), null)
  assert.doesNotMatch(work.firmWorkSettingFilter('Field Operations'), /ilike|\*/)
})

const primitive = ({ children }) => React.createElement('div', null, children)
const icons = new Proxy({}, { get: () => () => null })
const { FirmDetailTabs } = load('../app/firms/[slug]/FirmDetailTabs.tsx', {
  'lucide-react': icons,
  '@/components/ui/tabs': Object.fromEntries(['Tabs', 'TabsList', 'TabsTrigger', 'TabsContent'].map(name => [name, primitive])),
  '@/lib/firm-work-setting': work,
})

test('the actual profile displays an unknown setting without research notes and retains genuine categories', () => {
  const props = { firm: { name: 'Synthetic Jot', source: notes, industry_focus: 'Mobile Notary', services: 'Signing services' }, pay: null, hasCompensation: false, hasRequirements: false, hasReputation: false, hasContact: false, hasCoordinates: false, socialLinks: [] }
  const html = renderToStaticMarkup(React.createElement(FirmDetailTabs, props))
  assert.match(html, /Work Setting/)
  assert.match(html, /Not confirmed/)
  assert.doesNotMatch(html, /Official-site research|example.invalid|no application submitted/)
  assert.match(html, /overflow-wrap:anywhere/)
  const known = renderToStaticMarkup(React.createElement(FirmDetailTabs, { ...props, firm: { ...props.firm, source: 'Remote' } }))
  assert.ok(known.includes('Remote / Desk'))
})

import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import publicConfig from '../next.config.js'
import memberConfig from '../../web-members/next.config.mjs'

const require = createRequire(new URL('../../web-members/package.json', import.meta.url))
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const publicRules = await publicConfig.redirects()
const memberRules = await memberConfig.redirects()
const link = ({ children, ...props }) => React.createElement('a', props, children)
function load(relative, imports) {
  const filename = new URL(relative, import.meta.url)
  const source = readFileSync(filename, 'utf8')
  const output = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText
  const exports = {}
  vm.runInNewContext('(function(exports,require){' + output + '})', { URL, process: { env: { NODE_ENV: 'test' } } })(exports,
    name => Object.hasOwn(imports, name) ? imports[name] : require(name))
  return exports
}

test('public static redirects have no cycles, including Contact and legacy About aliases', () => {
  for (const initial of publicRules.filter(rule => !rule.source.includes(':'))) {
    let url = new URL(initial.source, 'https://www.nestedobjects.com')
    const visited = new Set()
    while (url.hostname === 'www.nestedobjects.com') {
      assert(!visited.has(url.href), `Redirect loop from ${initial.source}: ${url.href}`)
      visited.add(url.href)
      const rule = publicRules.find(item => item.source === url.pathname)
      if (!rule) break
      url = new URL(rule.destination, url)
    }
  }
})

test('About remains temporary and Contact reaches the existing member form', () => {
  const about = publicRules.filter(rule => rule.source === '/about')
  assert.deepEqual(about, [{ source: '/about', destination: 'https://members.nestedobjects.com/about-us', permanent: false }])
  const contact = publicRules.filter(rule => rule.source === '/contact')
  assert.deepEqual(contact, [{ source: '/contact', destination: 'https://members.nestedobjects.com/contact-us', permanent: true }])
  for (const rule of [...about, ...contact]) {
    assert(existsSync(new URL('../../web-members/app' + new URL(rule.destination).pathname + '/page.tsx', import.meta.url)))
  }
})

test('legacy Training resolves to the concrete curriculum index, not an arbitrary module gate', () => {
  const rules = memberRules.filter(rule => rule.source.startsWith('/training'))
  assert.deepEqual(rules, [{ source: '/training', destination: '/challenges', permanent: true }])
  assert(existsSync(new URL('../../web-members/app/challenges/page.tsx', import.meta.url)))
  assert(!existsSync(new URL('../../web-members/app/challenges/training-center/page.tsx', import.meta.url)))
  for (const path of ['/training/module-1/Overview.pdf', '/training-assets/video.mp4', '/training-center']) {
    assert(!rules.some(rule => rule.source === path))
  }
})

test('a generic anonymous module-access response cannot establish a valid Training destination', async () => {
  const never = () => { throw Error('Anonymous route must not read provider or database') }
  const module = load('../../web-members/app/challenges/[moduleId]/layout.tsx', {
    'next/link': link,
    '@/lib/auth-server': { getCurrentUser: async () => null },
    '@/lib/supabase-admin': { createServiceRoleClient: never },
    '@/lib/training-access': { canOpenTrainingModule: never, readTrainingAccess: never },
  })
  const views = await Promise.all(['training-center', 'nonexistent-fixture'].map(moduleId => module.default({ children: 'Hidden', params: { moduleId } })))
  assert.equal(renderToStaticMarkup(views[0]), renderToStaticMarkup(views[1]))
  assert.match(renderToStaticMarkup(views[0]), /href="\/challenges"/)
})

test('rendered shared Training navigation uses the curriculum and keeps its acquisition placement', () => {
  const layout = load('../app/layout.tsx', {
    'next/link': link, 'next/script': () => null, './globals.css': {},
    '@/components/AcquisitionJourneyTracker': { AcquisitionJourneyTracker: () => null },
  })
  const html = renderToStaticMarkup(React.createElement(layout.default, { children: 'Fixture' }))
  assert.match(html, /<a href="https:\/\/members\.nestedobjects\.com\/challenges" data-acquisition-source="public_navigation_5"[^>]*>Training<\/a>/)
  assert(!html.includes('members.nestedobjects.com/training'))
  assert.match(html, /href="\/about"/)
  assert.match(html, /href="\/contact"/)
})

test('approved comparison article links to the existing public preservation guide', () => {
  const blog = load('../../web-members/lib/blog.ts', {
    '@/lib/seo': { SITE_NAME: 'Nested Objects', SITE_URL: 'https://members.nestedobjects.com', DEFAULT_OG_IMAGE: '/fixture.png' },
    '@/content/blog-approvals.json': JSON.parse(readFileSync(new URL('../../web-members/content/blog-approvals.json', import.meta.url), 'utf8')),
  })
  const post = blog.getApprovedBlogPostBySlug('mortgage-field-inspection-vs-property-preservation')
  assert(post)
  const guide = post.internalLinks.find(item => item.label === 'Explore preservation guide')
  assert.equal(guide.href, 'https://www.nestedobjects.com/guides/how-to-start-a-property-preservation-business')
  assert(existsSync(new URL('../content/guides/how-to-start-a-property-preservation-business.mdx', import.meta.url)))
})

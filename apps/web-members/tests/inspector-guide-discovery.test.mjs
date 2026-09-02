import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const siteUrl = 'https://synthetic-members.example'
const guidePath = '/guides/how-to-become-a-field-inspector'
const link = { default: ({ children, ...props }) => React.createElement('a', props, children) }

// Render the actual guide and schema helper; destination checks call only the
// actual state route's static params and metadata, never its data loader.
function load(relativePath, imports = {}) {
  const code = ts.transpileModule(readFileSync(new URL(relativePath, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports, URL, console,
    require(name) {
      if (name === 'react/jsx-runtime') return require('react/jsx-runtime')
      if (name === 'lucide-react') return require('lucide-react')
      if (name in imports) return imports[name]
      throw new Error(`Unexpected import in ${relativePath}: ${name}`)
    },
  })
  return exports
}

const planConfig = load('../lib/plan-config.ts')
const seo = load('../lib/seo.ts', {
  '@/lib/seo-env': { getSiteUrl: () => siteUrl },
  '@/lib/plan-config': planConfig,
})
const guide = load(`../app${guidePath}/page.tsx`, {
  'next/link': link,
  '@/lib/seo': seo,
})
const constants = load('../app/hiring-firms/constants.ts')
const states = load('../app/hiring-firms/state-data.ts', { './constants': constants })
const stateRoute = load('../app/hiring-firms/[state]/page.tsx', {
  'next/link': link,
  'next/navigation': { notFound: () => { throw new Error('Unexpected notFound') } },
  '@/lib/seo': seo,
  '@/components/Breadcrumbs': { Breadcrumbs: () => null },
  '../state-data': states,
})

const html = renderToStaticMarkup(React.createElement(guide.default))
const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
  .map(match => JSON.parse(match[1]))
const text = markup => markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

test('guide emits one matching three-level breadcrumb with canonical URLs', () => {
  const breadcrumbs = schemas.filter(schema => schema['@type'] === 'BreadcrumbList')
  assert.equal(breadcrumbs.length, 1, 'exactly one page-specific breadcrumb list')
  assert.deepEqual(breadcrumbs[0], {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: `${siteUrl}/guides` },
      { '@type': 'ListItem', position: 3, name: 'How to Become a Field Inspector', item: `${siteUrl}${guidePath}` },
    ],
  })
  assert.equal(breadcrumbs[0].itemListElement.at(-1).item, guide.metadata.alternates.canonical)
})

test('existing visible breadcrumb navigation is preserved once and matches the schema', () => {
  const navs = [...html.matchAll(/<nav\b[^>]*aria-label="Breadcrumb"[^>]*>(.*?)<\/nav>/gs)]
  assert.equal(navs.length, 1)
  const breadcrumb = schemas.find(schema => schema['@type'] === 'BreadcrumbList')
  assert.equal(text(navs[0][1]), breadcrumb.itemListElement.map(item => item.name).join(' / '))
  assert.deepEqual([...navs[0][1].matchAll(/href="([^"]+)"/g)].map(match => match[1]), ['/', '/guides'])
})

test('guide retains its FAQ and HowTo structured data', () => {
  assert.deepEqual(schemas.map(schema => schema['@type']).sort(), ['BreadcrumbList', 'FAQPage', 'HowTo'])
  const faq = schemas.find(schema => schema['@type'] === 'FAQPage')
  assert.equal(faq.mainEntity.length, 4)
  for (const question of faq.mainEntity) assert.ok(text(html).includes(question.name))
  assert.equal(schemas.find(schema => schema['@type'] === 'HowTo').step.length, 5)
})

test('contextual state links resolve to existing state routes with accurate labels', async () => {
  const companies = html.match(/<h2\b[^>]*id="companies"[^>]*>.*?(?=<h2\b[^>]*id="training")/s)?.[0]
  assert.ok(companies, 'links belong to the existing company research section')
  const links = [...companies.matchAll(/<a\b([^>]*href="\/hiring-firms\/([^"]+)"[^>]*)>(.*?)<\/a>/gs)]
  assert.equal(links.length, 3)
  const staticSlugs = stateRoute.generateStaticParams().map(params => params.state)
  for (const [, attributes, slug, label] of links) {
    assert.ok(staticSlugs.includes(slug), `${slug} is a generated destination`)
    assert.equal(text(label), `${states.STATE_MAP[slug].label} field inspection firms`)
    assert.match(attributes, /\bunderline\b/)
    assert.match(attributes, /focus-visible:outline-2/)
    assert.doesNotMatch(attributes, /tabindex="-1"|aria-disabled="true"/i)
    const metadata = await stateRoute.generateMetadata({ params: Promise.resolve({ state: slug }) })
    assert.equal(metadata.alternates.canonical, `${siteUrl}/hiring-firms/${slug}`)
    assert.equal(metadata.title, `${states.STATE_MAP[slug].label} Field Inspector Firms Hiring`)
  }
})

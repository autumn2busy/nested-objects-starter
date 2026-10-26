import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
export const React = require('react')
export const { renderToStaticMarkup } = require('react-dom/server')

// Real management/profile components with synthetic auth/profile state. No
// effects, network, provider SDK, or customer data are used during SSR.
export function createManagementRenderer(authState, sourceFor = relative => readFileSync(new URL('../../' + relative, import.meta.url), 'utf8')) {
  const noSdk = new Proxy({}, { get() { throw new Error('Management rendering must not access the SDK') } })
  const load = (relative, imports = {}) => {
    const exports = {}
    const code = ts.transpileModule(sourceFor(relative), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText
    vm.runInNewContext(code, { exports, window: noSdk, fetch() { throw new Error('Network forbidden in management fixtures') },
      require(name) {
        if (name in imports) return imports[name]
        if (['react', 'react/jsx-runtime', 'lucide-react'].includes(name)) return require(name)
        throw new Error('Unexpected management import: ' + name)
      },
    })
    return exports
  }
  const destinations = load('lib/membership-management.ts')
  const components = load('components/outseta/MembershipManagement.tsx', { '@/lib/membership-management': destinations })
  const auth = { useAuth: () => authState }
  const gate = load('components/Gate.tsx', {
    './auth-provider': auth,
    'next/image': { default: () => null },
    '../lib/logoData': { logoDataUrl: '' },
  })
  const native = tag => function NativeFixture({ children, variant: _variant, size: _size, ...props }) {
    return React.createElement(tag, props, children)
  }
  const profile = load('app/(portal)/profile/ProfileView.tsx', {
    'next/link': { default: native('a') },
    '@/components/auth-provider': auth,
    '@/components/ui/button': { Button: native('button'), buttonVariants: ({ className }) => className },
    '@/components/ui/input': { Input: native('input') },
    '@/components/ui/select': { Select: native('select') },
    '@/components/ui/card': { Card: native('div') },
    '@/components/Gate': gate,
    '@/components/profile/AvatarUpload': { AvatarUpload: () => null },
    '@/lib/ac-events': { trackProfileCompleted() { throw new Error('No events allowed in management fixtures') } },
    '@/lib/plan-config': load('lib/plan-config.ts'),
    '@/lib/opportunity-alert-consent': { ELITE_OPPORTUNITY_ALERTS_OPT_IN_URL: 'https://example.test/unused' },
    '@/lib/membership-management': destinations,
    '@/components/outseta/MembershipManagement': components,
  })
  const initialProfile = { display_name: 'Synthetic member', email: 'member@example.test', created_at: '2026-10-01',
    trust_score: 0, service_areas: [], background_check_status: 'not_started' }
  return { ...components, destinations, renderProfile: () => renderToStaticMarkup(React.createElement(profile.default, { initialProfile, initialTrustStats: null })) }
}

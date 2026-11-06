import assert from 'node:assert/strict'
import test from 'node:test'
import { createManagementRenderer, React, renderToStaticMarkup } from './helpers/membership-management-render.mjs'

const auth = planUid => ({ isAuthenticated: true, isLoading: false, planUid, user: { sub: 'synthetic-management-member' }, hasAccess: () => true })
const plans = ['L9nbKV9Z', 'rQVqlLm6', 'NmdnNO90', 'rmk5Xk9g', 'pWrBRnWn']

test('management is a native Plan link without SDK calls, tokens, or automatic cancellation', () => {
  const { MembershipManagementLink, destinations } = createManagementRenderer(auth(plans[0]))
  const element = MembershipManagementLink({})
  assert.equal(element.type, 'a')
  assert.equal(element.props.href, destinations.MEMBERSHIP_MANAGEMENT_URL)
  assert.equal(element.props.onClick, undefined)
  assert.equal(element.props.onClickCapture, destinations.preserveHostedAccountNavigation)
  assert.equal(element.props.role, undefined)
  assert.match(element.props.className, /min-h-11/)
  assert.match(element.props.className, /focus-visible:outline/)
  const url = new URL(element.props.href)
  assert.equal(url.origin, 'https://nested-objects.outseta.com')
  assert.equal(url.pathname, '/profile')
  assert.equal(url.hash, '')
  assert.deepEqual([...url.searchParams], [['tab', 'plan']])
})

test('capture prevents SDK interception while preserving native pointer, keyboard and modified link defaults', () => {
  const { MembershipManagementLink } = createManagementRenderer(auth(plans[0]))
  for (const activation of [{ detail: 1 }, { detail: 0 }, { ctrlKey: true }, { metaKey: true }]) {
    const event = new Event('click', { bubbles: true, cancelable: true })
    let captureStopped = false
    MembershipManagementLink({}).props.onClickCapture({
      ...activation,
      nativeEvent: event,
      stopPropagation() { captureStopped = true; event.stopPropagation() },
      preventDefault() { throw new Error('Native link default must remain available') },
    })
    assert.equal(captureStopped, true)
    assert.equal(event.cancelBubble, true)
    assert.equal(event.defaultPrevented, false)
  }
})

for (const plan of plans) {
  test(`${plan}: actual profile puts management before trust/background sections and keeps private gate`, () => {
    const { renderProfile } = createManagementRenderer(auth(plan))
    const html = renderProfile()
    const managementIndex = html.indexOf('Manage or cancel membership')
    assert.ok(managementIndex > 0)
    assert.ok(managementIndex < html.indexOf('Trust Score Breakdown'))
    assert.ok(managementIndex < html.indexOf('Background Check'))
    assert.match(html, /href="https:\/\/nested-objects\.outseta\.com\/profile\?tab=profile"[^>]*>Edit account/)
    assert.match(html, /Only you can view your profile/)
    assert.doesNotMatch(html, /profile\?tab=planCancel|\/cancel(?:"|\?)/)
  })
}

test('unauthenticated and denied profile gates do not expose profile or management content', () => {
  for (const state of [{ ...auth(plans[0]), isAuthenticated: false }, { ...auth(plans[0]), hasAccess: () => false }]) {
    const html = createManagementRenderer(state).renderProfile()
    assert.doesNotMatch(html, /Manage or cancel membership|member@example\.test|Synthetic member/)
  }
})

test('instructions disclose provider sign-in and confirmation without promising a billing outcome', () => {
  const { MembershipManagementPanel } = createManagementRenderer(auth(plans[0]))
  const html = renderToStaticMarkup(React.createElement(MembershipManagementPanel, { planLabel: 'Pro Plan' }))
  assert.match(html, /Current plan: Pro Plan/)
  assert.match(html, /If asked, sign in/)
  assert.match(html, /Plan and Cancel subscription/)
  assert.match(html, /before confirming/)
  assert.doesNotMatch(html, /already cancel|no more charges|refund|cancelled successfully/i)
})

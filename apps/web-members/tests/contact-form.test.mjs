import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const React = require('react')
const ts = require('typescript')
const source = readFileSync(new URL('../app/contact-us/ContactForm.tsx', import.meta.url), 'utf8')
const code = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.React,
    esModuleInterop: true,
  },
}).outputText

// Execute the actual component and submit handler. React elements are real;
// only hooks, FormData and fetch are isolated so these tests cannot send mail.
function loadForm({ ok = true, status = ok ? 200 : 500, body, networkError = false, invalidJson = false } = {}) {
  const values = {
    name: 'Synthetic visitor',
    email: 'visitor@example.test',
    topic: 'Something else',
    message: 'Synthetic contact form test',
  }
  const initialValues = { ...values }
  const calls = { resets: 0, requests: [], logs: [] }
  const states = []
  let cursor = 0
  const form = {
    reset() {
      calls.resets++
      for (const key of Object.keys(values)) values[key] = ''
    },
  }
  const exports = {}
  vm.runInNewContext(code, {
    exports,
    FormData: class {
      constructor(element) { assert.equal(element, form) }
      get(key) { return values[key] }
    },
    fetch: async (url, options) => {
      calls.requests.push({ url, options })
      if (networkError) throw new Error('Synthetic private network error')
      return {
        ok,
        status,
        async json() {
          if (invalidJson) throw new Error('Synthetic private JSON error')
          return body
        },
      }
    },
    console: Object.fromEntries(['log', 'warn', 'error'].map(level => [
      level, (...args) => calls.logs.push([level, ...args]),
    ])),
    require(name) {
      assert.equal(name, 'react')
      return {
        ...React,
        useState(initial) {
          const index = cursor++
          if (!(index in states)) states[index] = initial
          return [states[index], value => { states[index] = value }]
        },
      }
    },
  })

  function render() {
    cursor = 0
    return exports.default()
  }

  function submit() {
    const element = find(render(), node => node.type === 'form')
    assert.ok(element)
    const event = { currentTarget: form, preventDefault() {} }
    const pending = element.props.onSubmit(event)
    // React currentTarget is available only during the synchronous handler.
    // A later reset must use the captured form, not the event property.
    event.currentTarget = null
    return pending
  }

  return { render, submit, values, initialValues, calls }
}

function nodes(tree) {
  if (tree === null || tree === undefined || typeof tree === 'boolean') return []
  if (Array.isArray(tree)) return tree.flatMap(nodes)
  if (typeof tree !== 'object') return [tree]
  return [tree, ...nodes(tree.props?.children)]
}

function find(tree, predicate) {
  return nodes(tree).find(node => typeof node === 'object' && predicate(node))
}

function text(tree) {
  return nodes(tree).filter(node => typeof node === 'string' || typeof node === 'number').join(' ')
}

function assertPreservedFailure(harness, message = /could not confirm.*saved/i) {
  const tree = harness.render()
  assert.ok(find(tree, node => node.type === 'form'))
  assert.equal(find(tree, node => node.props.role === 'status'), undefined)
  assert.match(text(find(tree, node => node.props.role === 'alert')), message)
  assert.ok(find(tree, node => node.props.href === 'mailto:info@nestedobjects.com'))
  assert.equal(harness.calls.resets, 0)
  assert.deepEqual(harness.values, harness.initialValues)
  assert.equal(find(tree, node => node.type === 'button').props.disabled, false)
  assert.deepEqual(harness.calls.logs, [])
}

test('confirmed receipt and provider acceptance are separate, and captured form resets after await', async () => {
  const harness = loadForm({ body: { success: true, stored: true, notification: 'provider_accepted' } })
  const pending = harness.submit()
  assert.equal(find(harness.render(), node => node.type === 'button').props.disabled, true)
  assert.equal(find(harness.render(), node => node.type === 'form').props['aria-busy'], true)
  await pending

  const tree = harness.render()
  const status = find(tree, node => node.props.role === 'status')
  assert.equal(status.props['aria-live'], 'polite')
  assert.match(text(status), /message has been saved/)
  assert.match(text(status), /notification was accepted for delivery/)
  assert.match(text(status), /Inbox delivery is not yet confirmed/)
  assert.equal(find(tree, node => node.type === 'form'), undefined)
  assert.equal(harness.calls.resets, 1)
  assert.equal(harness.calls.requests.length, 1)
  assert.equal(harness.calls.requests[0].url, '/api/contact')
  assert.equal(harness.calls.requests[0].options.method, 'POST')
  assert.deepEqual(JSON.parse(harness.calls.requests[0].options.body), harness.initialValues)
  assert.deepEqual(harness.calls.logs, [])
})

test('stored messages with unavailable or unknown notification status offer direct follow-up, not resubmission', async () => {
  for (const notification of ['not_configured', 'failed', 'not_attempted', 'unexpected', undefined]) {
    const harness = loadForm({ body: { success: true, stored: true, notification } })
    await harness.submit()
    const tree = harness.render()
    const status = find(tree, node => node.props.role === 'status')
    assert.match(text(status), /message has been saved/)
    assert.match(text(status), /could not confirm an email notification/)
    assert.match(text(status), /do not need to submit this form again/)
    assert.ok(find(status, node => node.props.href === 'mailto:info@nestedobjects.com'))
    assert.equal(find(tree, node => node.type === 'form'), undefined)
    assert.equal(harness.calls.resets, 1)
    assert.equal(harness.calls.requests.length, 1)
    assert.deepEqual(harness.calls.logs, [])
  }
})

test('HTTP success alone never reports receipt or clears entered data', async () => {
  for (const body of [
    null, [], {}, { message: 'Message sent!' },
    { success: true }, { stored: true },
    { success: false, stored: true }, { success: true, stored: false },
    { success: 'true', stored: 'true' },
  ]) {
    const harness = loadForm({ body })
    await harness.submit()
    assertPreservedFailure(harness)
  }
})

test('non-success HTTP responses preserve fields even when the payload claims success', async () => {
  for (const body of [
    { success: false, stored: false, notification: 'not_attempted', error: 'Unavailable' },
    { success: true, stored: true, notification: 'provider_accepted' },
  ]) {
    const harness = loadForm({ ok: false, body })
    await harness.submit()
    assertPreservedFailure(harness)
  }
})

test('network errors and invalid JSON preserve fields without logging submitted data or promising retry safety', async () => {
  for (const failure of [{ networkError: true }, { invalidJson: true }]) {
    const harness = loadForm(failure)
    await harness.submit()
    assertPreservedFailure(harness)
    assert.doesNotMatch(text(harness.render()), /please try again|Synthetic private/i)
  }
})

test('confirmed API rejection shows fixed actionable guidance and never displays arbitrary error text', async () => {
  for (const [status, message] of [
    [400, /check your email address and the form fields/i],
    [413, /message is too large.*shorten it/i],
    [429, /wait one minute before trying again/i],
    [503, /could not save your message.*try again shortly/i],
  ]) {
    const harness = loadForm({
      ok: false,
      status,
      body: {
        success: false,
        stored: false,
        notification: 'not_attempted',
        error: 'Arbitrary private server details',
      },
    })
    await harness.submit()
    assertPreservedFailure(harness, message)
    assert.doesNotMatch(text(harness.render()), /Arbitrary private server details/i)
  }
})

test('HTTP status alone does not promise retry safety after an uncertain receipt', async () => {
  for (const status of [400, 413, 429, 503]) {
    for (const body of [undefined, {}, { success: false }, { success: true, stored: true }]) {
      const harness = loadForm({ ok: false, status, body })
      await harness.submit()
      assertPreservedFailure(harness)
      assert.doesNotMatch(text(harness.render()), /could not save|try again shortly|wait one minute/i)
    }
  }
})

test('editable field length limits match the server contract', () => {
  const tree = loadForm().render()
  assert.equal(find(tree, node => node.props.name === 'name').props.maxLength, 120)
  assert.equal(find(tree, node => node.props.name === 'email').props.maxLength, 254)
  assert.equal(find(tree, node => node.props.name === 'message').props.maxLength, 5000)
})

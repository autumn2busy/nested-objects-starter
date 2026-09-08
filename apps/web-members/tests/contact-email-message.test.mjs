import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const source = readFileSync(new URL('../lib/contact-email-message.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const exports = {}
vm.runInNewContext(code, { exports })
const { createContactEmail, isContactReplyEmail } = exports
const receiptId = '31800000-0000-4000-8000-000000000008'
const submission = {
  name: 'Synthetic Visitor', email: 'visitor+contact@example.test',
  topic: 'Billing question', message: 'Synthetic message only.',
}

test('internal contact notification fixes recipient and sender while replies reach the visitor', () => {
  const message = createContactEmail({ ...submission, to: 'other@example.test', from: 'other@example.test' }, receiptId)
  assert.equal(message.to, 'info@nestedobjects.com')
  assert.equal(message.from, 'info@nestedobjects.com')
  assert.equal(message.replyTo, submission.email)
  assert.equal(message.messageId, `<contact-${receiptId}@nestedobjects.com>`)
  assert.match(message.text, /Synthetic message only/)
  assert.equal(Object.hasOwn(message, 'html'), false)
})

test('reply address accepts ordinary single mailboxes and rejects lists, controls, or header injection', () => {
  for (const email of ['visitor@example.test', "o'brien+tag@example.test", 'a.b@xn--bcher-kva.test']) {
    assert.equal(isContactReplyEmail(email), true, email)
  }
  for (const email of [
    'one@example.test,two@example.test', 'a,b@example.test', 'a;b@example.test',
    'Name <a@example.test>', 'a@example.test\r\nBcc: other@example.test',
    '.a@example.test', 'a..b@example.test', 'a.@example.test', 'a@-example.test',
    'a@example..test', 'a@localhost', 'a@exa_mple.test', `${'x'.repeat(65)}@example.test`,
  ]) {
    assert.equal(isContactReplyEmail(email), false, email)
  }
})

test('notification rejects unsafe receipt and topic headers with generic errors', () => {
  assert.throws(() => createContactEmail({ ...submission, topic: 'Billing\r\nBcc: bad' }, receiptId), /Invalid contact notification fields/)
  assert.throws(() => createContactEmail(submission, 'bad\r\nBcc: bad'), /Invalid contact notification fields/)
  assert.throws(() => createContactEmail({ ...submission, email: 'bad' }, receiptId), /Invalid contact notification fields/)
})

test('visitor markup and newlines stay in the plain-text body, never in recipient or subject headers', () => {
  const message = createContactEmail({ ...submission, name: 'Visitor\r\nBcc: injected', message: '<script>text</script>\nAnother line' }, receiptId)
  assert.equal(message.to, 'info@nestedobjects.com')
  assert.equal(message.subject, 'Nested Objects contact: Billing question')
  assert.match(message.text, /<script>text<\/script>/)
  assert.equal(Object.hasOwn(message, 'html'), false)
})

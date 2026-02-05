import { test } from 'node:test'
import assert from 'node:assert'
import { rateLimit } from '../lib/rate-limit'

test('Rate Limiter', async (t) => {
    await t.test('allows requests within limit', async () => {
        const limiter = rateLimit({ limit: 2, intervalMs: 1000 })

        await limiter.check('user1') // 1
        await limiter.check('user1') // 2
        assert.ok(true, 'Should not throw')
    })

    await t.test('blocks requests execution limit', async () => {
        const limiter = rateLimit({ limit: 1, intervalMs: 1000 })

        await limiter.check('user2')

        try {
            await limiter.check('user2')
            assert.fail('Should have thrown')
        } catch (e: any) {
            assert.strictEqual(e.message, 'Rate limit exceeded')
        }
    })

    await t.test('resets after interval', async () => {
        const limiter = rateLimit({ limit: 1, intervalMs: 10 }) // short interval

        await limiter.check('user3')

        // Wait for reset
        await new Promise(resolve => setTimeout(resolve, 20))

        await limiter.check('user3') // Should succeed now
        assert.ok(true, 'Should limit reset')
    })

    await t.test('independent limits per user', async () => {
        const limiter = rateLimit({ limit: 1, intervalMs: 1000 })

        await limiter.check('userA')
        await limiter.check('userB') // Different user, should pass

        try {
            await limiter.check('userA')
            assert.fail('User A should be blocked')
        } catch {
            assert.ok(true)
        }
    })
})

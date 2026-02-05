import { test } from 'node:test'
import assert from 'node:assert'
import crypto from 'crypto'
import { verifyOutsetaSignature } from '../lib/security'

test('Webhook Security', async (t) => {
    await t.test('verifyOutsetaSignature returns true for valid signature', () => {
        const secret = 'my-secret-key';
        const body = JSON.stringify({ event: 'test' });

        // Calculate expected HMAC
        const hmac = crypto.createHmac('sha256', Buffer.from(secret, 'hex'));
        hmac.update(body);
        const signature = `sha256=${hmac.digest('hex')}`;

        const isValid = verifyOutsetaSignature(signature, body, secret);
        assert.strictEqual(isValid, true);
    })

    await t.test('verifyOutsetaSignature returns false for invalid signature', () => {
        const secret = 'my-secret-key';
        const body = JSON.stringify({ event: 'test' });
        const signature = 'sha256=invalidSignature';

        const isValid = verifyOutsetaSignature(signature, body, secret);
        assert.strictEqual(isValid, false);
    })

    await t.test('verifyOutsetaSignature returns false for modified body', () => {
        const secret = 'my-secret-key';
        const body = JSON.stringify({ event: 'test' });

        // Calculate signature for original body
        const hmac = crypto.createHmac('sha256', Buffer.from(secret, 'hex'));
        hmac.update(body);
        const signature = `sha256=${hmac.digest('hex')}`;

        // Modify body
        const modifiedBody = JSON.stringify({ event: 'tampered' });

        const isValid = verifyOutsetaSignature(signature, modifiedBody, secret);
        assert.strictEqual(isValid, false);
    })

    await t.test('verifyOutsetaSignature handles missing headers gracefully', () => {
        assert.strictEqual(verifyOutsetaSignature('', '{}', 'secret'), false);
        assert.strictEqual(verifyOutsetaSignature('sig', '{}', ''), false);
    })
})

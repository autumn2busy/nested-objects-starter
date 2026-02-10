import { test } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { verifyOutsetaSignature } from '../lib/security';

function createSignature(body: string, secret: Buffer | string): string {
    const digest = crypto.createHmac('sha256', secret).update(body).digest('hex');
    return `sha256=${digest}`;
}

test('verifyOutsetaSignature hardening', async (t) => {
    await t.test('returns true for valid signature with UTF-8 secret', () => {
        const secret = 'my-secret-key';
        const body = JSON.stringify({ event: 'test' });
        const signature = createSignature(body, secret);

        assert.strictEqual(verifyOutsetaSignature(signature, body, secret), true);
    });

    await t.test('returns true for valid signature with hex-encoded secret', () => {
        const utf8Secret = 'another-secret-key';
        const hexSecret = Buffer.from(utf8Secret, 'utf-8').toString('hex');
        const body = JSON.stringify({ event: 'hex-test' });
        const signature = createSignature(body, Buffer.from(hexSecret, 'hex'));

        assert.strictEqual(verifyOutsetaSignature(signature, body, hexSecret), true);
    });

    await t.test('returns false for invalid signature', () => {
        const secret = 'my-secret-key';
        const body = JSON.stringify({ event: 'test' });

        assert.strictEqual(verifyOutsetaSignature('sha256=invalidSignature', body, secret), false);
    });

    await t.test('returns false for empty and null-like inputs', () => {
        const body = JSON.stringify({ event: 'test' });
        const secret = 'my-secret-key';
        const signature = createSignature(body, secret);

        assert.strictEqual(verifyOutsetaSignature('', body, secret), false);
        assert.strictEqual(verifyOutsetaSignature(signature, '', secret), false);
        assert.strictEqual(verifyOutsetaSignature(signature, body, ''), false);
        assert.strictEqual(verifyOutsetaSignature(null, body, secret), false);
        assert.strictEqual(verifyOutsetaSignature(signature, null, secret), false);
        assert.strictEqual(verifyOutsetaSignature(signature, body, null), false);
    });
});

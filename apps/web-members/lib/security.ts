import crypto from 'crypto';

function isHexString(value: string): boolean {
    return value.length > 0 && value.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(value);
}

function safeTimingEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left, 'utf-8');
    const rightBuffer = Buffer.from(right, 'utf-8');

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

/**
 * Verify HMAC-SHA256 signature for Outseta webhooks
 */
export function verifyOutsetaSignature(
    signature: string | null | undefined,
    bodyAsString: string | null | undefined,
    outsetaKey: string | null | undefined
): boolean {
    if (!signature || !outsetaKey || !bodyAsString) return false;

    try {
        const normalizedSignature = signature.trim();
        const signatureWithPrefix = normalizedSignature.startsWith('sha256=')
            ? normalizedSignature
            : `sha256=${normalizedSignature}`;

        if (!signatureWithPrefix || signatureWithPrefix === 'sha256=') {
            return false;
        }

        const payloadToSign = Buffer.from(bodyAsString, 'utf-8');
        const keyCandidates: Buffer[] = [Buffer.from(outsetaKey, 'utf-8')];
        const trimmedKey = outsetaKey.trim();

        if (isHexString(trimmedKey)) {
            keyCandidates.push(Buffer.from(trimmedKey, 'hex'));
        }

        for (const key of keyCandidates) {
            const calculatedDigest = crypto
                .createHmac('sha256', key)
                .update(payloadToSign)
                .digest('hex');

            if (safeTimingEqual(signatureWithPrefix, `sha256=${calculatedDigest}`)) {
                return true;
            }
        }

        return false;
    } catch {
        return false;
    }
}

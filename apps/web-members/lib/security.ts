import crypto from 'crypto';

/**
 * Verify HMAC-SHA256 signature for Outseta webhooks
 */
export function verifyOutsetaSignature(
    signature: string,
    bodyAsString: string,
    keyAsHex: string
): boolean {
    if (!signature || !keyAsHex) return false;

    try {
        const key = Buffer.from(keyAsHex, 'hex');
        const payloadToSign = Buffer.from(bodyAsString, 'utf-8');
        const calculatedSignature = crypto
            .createHmac('sha256', key)
            .update(payloadToSign)
            .digest('hex');

        // Support both raw hex and sha256= prefix formats if needed, 
        // though Outseta usually sends just the hex or sha256=hex?
        // The previous code expected `sha256=${calculatedSignature}`.
        // Let's stick to that strict check.
        return signature === `sha256=${calculatedSignature}`;
    } catch {
        return false;
    }
}

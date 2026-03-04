import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

/**
 * Supabase Webhook Endpoint for 'firms' table mutations
 * This will burst the Next.js cache whenever a firm is inserted, updated, or deleted
 * ensuring the directory pages load instantly but are never stale.
 */
export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const secret = process.env.SUPABASE_WEBHOOK_SECRET;

        // Optional but highly recommended: secure the webhook with a Bearer token
        if (secret && authHeader !== `Bearer ${secret}`) {
            return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
        }

        const payload = await request.json();

        // Verify it's coming from the right table
        if (payload.table === 'firms') {
            console.log(`[Webhook] Invalidating 'firms' cache due to ${payload.type} on firm: ${payload.record?.name || payload.old_record?.name}`);

            // Revalidate the global 'firms' tag
            revalidateTag('firms');

            // Revalidate the specific firm profile if possible
            const slug = payload.record?.slug || payload.old_record?.slug;
            if (slug) {
                revalidateTag(`firm-${slug}`);
            }

            return NextResponse.json({ revalidated: true, now: Date.now() });
        }

        return NextResponse.json({ message: 'Ignored: not the firms table' });

    } catch (error: any) {
        console.error('[Supabase Webhook Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

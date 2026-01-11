import { NextRequest, NextResponse } from 'next/server';

// Note: In Cloudflare Pages, the D1 binding is provided via env object
// For local development, we use wrangler dev or similar.
// This is a placeholder for the sync logic as the actual D1 binding
// depends on the environment setup.

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { categories, items, transactions } = body;

        console.log('Syncing data:', {
            categoriesCount: categories?.length || 0,
            itemsCount: items?.length || 0,
            transactionsCount: transactions?.length || 0
        });

        // TODO: Implement D1 persistence logic here
        // For now, we acknowledges the request

        return NextResponse.json({
            success: true,
            message: 'Sync received'
        });
    } catch (err) {
        console.error('Sync Error:', err);
        return NextResponse.json({
            success: false,
            error: err instanceof Error ? err.message : 'Sync failed'
        }, { status: 500 });
    }
}

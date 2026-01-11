import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET() {
    try {
        const { env } = await getCloudflareContext();
        const db = env.DB;

        if (!db) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        const result = await db.prepare(`
            SELECT t.*, i.name as item_name, i.code as item_code
            FROM transactions t 
            LEFT JOIN items i ON t.item_id = i.id 
            ORDER BY t.created_at DESC
            LIMIT 100
        `).all();

        // Transform snake_case to camelCase
        const transactions = result.results.map((row: Record<string, unknown>) => ({
            id: row.id,
            itemId: row.item_id,
            itemName: row.item_name,
            itemCode: row.item_code,
            type: row.type,
            quantity: row.quantity,
            notes: row.notes,
            createdAt: row.created_at,
            syncStatus: row.sync_status
        }));

        return NextResponse.json(transactions);
    } catch (err) {
        console.error('Error fetching transactions:', err);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}

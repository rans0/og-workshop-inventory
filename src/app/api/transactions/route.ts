import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// GET transactions with filters
export async function GET(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = env.DB;

        if (!db) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '100');

        const result = await db.prepare(`
            SELECT t.*, i.name as item_name, i.code as item_code, i.price as item_price, 
                   c.name as category_name, c.id as category_id
            FROM transactions t 
            LEFT JOIN items i ON t.item_id = i.id 
            LEFT JOIN categories c ON i.category_id = c.id
            ORDER BY t.created_at DESC
            LIMIT ?
        `).bind(limit).all();

        const transactions = result.results.map((row: Record<string, unknown>) => ({
            id: row.id,
            itemId: row.item_id,
            itemName: row.item_name,
            itemCode: row.item_code,
            itemPrice: row.item_price || 0,
            categoryId: row.category_id,
            categoryName: row.category_name,
            type: row.type,
            quantity: row.quantity,
            notes: row.notes,
            createdAt: row.created_at
        }));

        return NextResponse.json(transactions);
    } catch (err) {
        console.error('Error fetching transactions:', err);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}

// POST create new transaction
export async function POST(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = env.DB;

        if (!db) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        const body = await request.json();
        const { itemId, type, quantity, notes = '' } = body;

        if (!itemId || !type || !quantity) {
            return NextResponse.json({ error: 'itemId, type, and quantity are required' }, { status: 400 });
        }

        if (!['IN', 'OUT'].includes(type)) {
            return NextResponse.json({ error: 'type must be IN or OUT' }, { status: 400 });
        }

        const id = crypto.randomUUID();

        // Insert transaction
        await db.prepare(`
            INSERT INTO transactions (id, item_id, type, quantity, notes, sync_status)
            VALUES (?, ?, ?, ?, ?, 'SYNCED')
        `).bind(id, itemId, type, quantity, notes).run();

        // Update item stock
        const stockDelta = type === 'IN' ? quantity : -quantity;
        await db.prepare(`
            UPDATE items 
            SET current_stock = current_stock + ?, last_updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(stockDelta, itemId).run();

        return NextResponse.json({ id, success: true }, { status: 201 });
    } catch (err) {
        console.error('Error creating transaction:', err);
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
}

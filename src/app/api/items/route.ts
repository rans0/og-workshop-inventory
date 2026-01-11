import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// GET all items with category info
export async function GET(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = env.DB;

        if (!db) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        const url = new URL(request.url);
        const categoryId = url.searchParams.get('category');

        let query = `
            SELECT i.*, c.name as category_name 
            FROM items i 
            LEFT JOIN categories c ON i.category_id = c.id
        `;

        if (categoryId) {
            query += ` WHERE i.category_id = ?`;
        }

        query += ` ORDER BY i.name`;

        const stmt = categoryId
            ? db.prepare(query).bind(categoryId)
            : db.prepare(query);

        const result = await stmt.all();

        const items = result.results.map((row: Record<string, unknown>) => ({
            id: row.id,
            code: row.code,
            name: row.name,
            categoryId: row.category_id,
            categoryName: row.category_name,
            currentStock: row.current_stock,
            unit: row.unit,
            price: row.price || 0,
            lastUpdatedAt: row.last_updated_at
        }));

        return NextResponse.json(items);
    } catch (err) {
        console.error('Error fetching items:', err);
        return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }
}

// POST create new item
export async function POST(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = env.DB;

        if (!db) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        const body = await request.json();
        const { name, categoryId, unit = 'pcs', price = 0 } = body;

        if (!name || typeof name !== 'string' || name.trim().length < 3) {
            return NextResponse.json({ error: 'Nama barang minimal 3 karakter' }, { status: 400 });
        }

        if (!categoryId) {
            return NextResponse.json({ error: 'Kategori harus dipilih' }, { status: 400 });
        }

        const trimmedName = name.trim();

        // Check for duplicates in the SAME category
        const existing = await db.prepare(`SELECT id FROM items WHERE name = ? AND category_id = ? COLLATE NOCASE`).bind(trimmedName, categoryId).first();
        if (existing) {
            return NextResponse.json({ error: 'Nama barang sudah ada di kategori ini' }, { status: 400 });
        }

        const id = crypto.randomUUID();

        // Generate item code
        const countResult = await db.prepare(`SELECT COUNT(*) as count FROM items`).first();
        const count = (countResult?.count as number) || 0;
        const code = `WS-${String(count + 1).padStart(4, '0')}`;

        await db.prepare(`
            INSERT INTO items (id, code, name, category_id, unit, price, current_stock)
            VALUES (?, ?, ?, ?, ?, ?, 0)
        `).bind(id, code, trimmedName, categoryId, unit, price).run();

        return NextResponse.json({ id, code, name: trimmedName }, { status: 201 });
    } catch (err) {
        console.error('Error creating item:', err);
        return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// GET all categories
export async function GET(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = env.DB;

        if (!db) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        const url = new URL(request.url);
        const includeDeleted = url.searchParams.get('includeDeleted') === 'true';

        // Get categories with item count and total stock
        const result = await db.prepare(`
            SELECT 
                c.id,
                c.name,
                c.created_at,
                c.is_deleted as category_deleted,
                COUNT(i.id) as item_count,
                COALESCE(SUM(i.current_stock), 0) as total_stock
            FROM categories c
            LEFT JOIN items i ON c.id = i.category_id AND i.is_deleted = 0
            WHERE 1=1 ${includeDeleted ? '' : 'AND c.is_deleted = 0'}
            GROUP BY c.id
            ORDER BY c.name
        `).all();

        const categories = result.results.map((row: Record<string, unknown>) => ({
            id: row.id,
            name: row.name,
            createdAt: row.created_at,
            isDeleted: row.category_deleted,
            itemCount: row.item_count,
            totalStock: row.total_stock
        }));

        return NextResponse.json(categories);
    } catch (err) {
        console.error('Error fetching categories:', err);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

// POST create new category
export async function POST(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = env.DB;

        if (!db) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        const body = await request.json();
        const { name } = body;

        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return NextResponse.json({ error: 'Nama kategori minimal 2 karakter' }, { status: 400 });
        }

        const trimmedName = name.trim();

        // Check for duplicates (only active categories)
        const existing = await db.prepare(`SELECT id FROM categories WHERE name = ? AND is_deleted = 0 COLLATE NOCASE`).bind(trimmedName).first();
        if (existing) {
            return NextResponse.json({ error: 'Nama kategori sudah ada' }, { status: 400 });
        }

        const id = crypto.randomUUID();

        await db.prepare(`
            INSERT INTO categories (id, name) VALUES (?, ?)
        `).bind(id, trimmedName).run();

        return NextResponse.json({ id, name: name.trim() }, { status: 201 });
    } catch (err) {
        console.error('Error creating category:', err);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}

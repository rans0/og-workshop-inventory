import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// GET single category with items
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { env } = await getCloudflareContext();
        const db = env.DB;
        const { id } = await params;

        if (!db) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        // Get category
        const categoryResult = await db.prepare(`
            SELECT * FROM categories WHERE id = ?
        `).bind(id).first();

        if (!categoryResult) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // Get items in this category
        const itemsResult = await db.prepare(`
            SELECT * FROM items WHERE category_id = ? ORDER BY name
        `).bind(id).all();

        const items = itemsResult.results.map((row: Record<string, unknown>) => ({
            id: row.id,
            code: row.code,
            name: row.name,
            currentStock: row.current_stock,
            unit: row.unit,
            price: row.price || 0,
            lastUpdatedAt: row.last_updated_at
        }));

        return NextResponse.json({
            id: categoryResult.id,
            name: categoryResult.name,
            createdAt: categoryResult.created_at,
            items,
            totalStock: items.reduce((sum: number, i: { currentStock: number }) => sum + i.currentStock, 0)
        });
    } catch (err) {
        console.error('Error fetching category:', err);
        return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
    }
}

// PUT update category
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { env } = await getCloudflareContext();
        const db = env.DB;
        const { id } = await params;

        if (!db) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        const body = await request.json();
        const { name } = body;

        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return NextResponse.json({ error: 'Nama kategori minimal 2 karakter' }, { status: 400 });
        }

        const trimmedName = name.trim();

        // Check for duplicates (excluding the current category)
        const existing = await db.prepare(`SELECT id FROM categories WHERE name = ? AND id != ? COLLATE NOCASE`).bind(trimmedName, id).first();
        if (existing) {
            return NextResponse.json({ error: 'Nama kategori sudah ada' }, { status: 400 });
        }

        await db.prepare(`
            UPDATE categories SET name = ? WHERE id = ?
        `).bind(trimmedName, id).run();

        return NextResponse.json({ id, name: trimmedName });
    } catch (err) {
        console.error('Error updating category:', err);
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }
}

// DELETE category (cascade delete items)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { env } = await getCloudflareContext();
        const db = env.DB;
        const { id } = await params;

        if (!db) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        // Delete items first (cascade)
        await db.prepare(`
            DELETE FROM items WHERE category_id = ?
        `).bind(id).run();

        // Delete category
        await db.prepare(`
            DELETE FROM categories WHERE id = ?
        `).bind(id).run();

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error deleting category:', err);
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}

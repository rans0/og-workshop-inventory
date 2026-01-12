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
        const url = new URL(request.url);
        const includeDeleted = url.searchParams.get('includeDeleted') === 'true';

        if (!db) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        // Get category
        const categoryResult = await db.prepare(`
            SELECT * FROM categories WHERE id = ? ${includeDeleted ? '' : 'AND is_deleted = 0'}
        `).bind(id).first();

        if (!categoryResult) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        // Get items in this category
        const itemsResult = await db.prepare(`
            SELECT * FROM items WHERE category_id = ? ${includeDeleted ? '' : 'AND is_deleted = 0'} ORDER BY name
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
        const { name, restore } = body;

        // Restore logic
        if (restore) {
            const current = await db.prepare(`SELECT name, is_deleted FROM categories WHERE id = ?`).bind(id).first();
            if (!current) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
            if (current.is_deleted === 0) return NextResponse.json({ error: 'Category already active' }, { status: 400 });

            const originalName = (current.name as string).replace(/-DEL-\d+$/, '');
            const collision = await db.prepare(`SELECT id FROM categories WHERE name = ? AND is_deleted = 0`).bind(originalName).first();
            if (collision) return NextResponse.json({ error: 'Nama kategori sudah digunakan oleh kategori aktif lain' }, { status: 400 });

            await db.prepare(`UPDATE categories SET name = ?, is_deleted = 0 WHERE id = ?`).bind(originalName, id).run();
            // Note: restoring category does NOT automatically restore items. User should restore items manually.
            return NextResponse.json({ success: true, message: 'Category restored' });
        }

        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return NextResponse.json({ error: 'Nama kategori minimal 2 karakter' }, { status: 400 });
        }

        const trimmedName = name.trim();

        // Check for duplicates (excluding the current category, only active ones)
        const existing = await db.prepare(`SELECT id FROM categories WHERE name = ? AND id != ? AND is_deleted = 0 COLLATE NOCASE`).bind(trimmedName, id).first();
        if (existing) {
            return NextResponse.json({ error: 'Nama kategori sudah ada' }, { status: 400 });
        }

        await db.prepare(`
            UPDATE categories SET name = ? WHERE id = ? AND is_deleted = 0
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

        const category = await db.prepare(`SELECT name FROM categories WHERE id = ?`).bind(id).first();
        if (category) {
            const timestamp = Date.now();
            const newCatName = `${category.name}-DEL-${timestamp}`;

            // Soft delete items in this category and suffix them too
            const items = await db.prepare(`SELECT id, name, code FROM items WHERE category_id = ? AND is_deleted = 0`).bind(id).all();
            for (const item of items.results) {
                const newItemName = `${item.name}-DEL-${timestamp}`;
                const newItemCode = `${item.code}-DEL-${timestamp}`;
                await db.prepare(`UPDATE items SET is_deleted = 1, name = ?, code = ? WHERE id = ?`).bind(newItemName, newItemCode, item.id).run();
            }

            // Soft delete category
            await db.prepare(`
                UPDATE categories SET is_deleted = 1, name = ? WHERE id = ?
            `).bind(newCatName, id).run();
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error deleting category:', err);
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}

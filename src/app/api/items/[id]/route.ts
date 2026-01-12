import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// GET single item
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

        const url = new URL(request.url);
        const includeDeleted = url.searchParams.get('includeDeleted') === 'true';

        const result = await db.prepare(`
            SELECT i.*, c.name as category_name 
            FROM items i 
            LEFT JOIN categories c ON i.category_id = c.id
            WHERE i.id = ? ${includeDeleted ? '' : 'AND i.is_deleted = 0'}
        `).bind(id).first();

        if (!result) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: result.id,
            code: result.code,
            name: result.name,
            categoryId: result.category_id,
            categoryName: result.category_name,
            currentStock: result.current_stock,
            unit: result.unit,
            price: result.price || 0,
            lastUpdatedAt: result.last_updated_at
        });
    } catch (err) {
        console.error('Error fetching item:', err);
        return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
    }
}

// PUT update item
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
        const { name, categoryId, price, adjustment, restore } = body;

        // Restore logic
        if (restore) {
            const currentItem = await db.prepare(`SELECT name, code, is_deleted FROM items WHERE id = ?`).bind(id).first();
            if (!currentItem) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
            if (currentItem.is_deleted === 0) return NextResponse.json({ error: 'Item already active' }, { status: 400 });

            // Remove suffix if exists to check for collisions
            const originalName = (currentItem.name as string).replace(/-DEL-\d+$/, '');
            const originalCode = (currentItem.code as string).replace(/-DEL-\d+$/, '');

            const collision = await db.prepare(`SELECT id FROM items WHERE (name = ? OR code = ?) AND is_deleted = 0`).bind(originalName, originalCode).first();
            if (collision) {
                return NextResponse.json({ error: 'Nama atau kode barang sudah digunakan oleh barang aktif lain' }, { status: 400 });
            }

            await db.prepare(`UPDATE items SET name = ?, code = ?, is_deleted = 0 WHERE id = ?`).bind(originalName, originalCode, id).run();
            return NextResponse.json({ success: true, message: 'Item restored' });
        }

        // Validation
        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length < 3) {
                return NextResponse.json({ error: 'Nama barang minimal 3 karakter' }, { status: 400 });
            }
        }

        const updates: string[] = [];
        const values: (string | number)[] = [];

        if (name !== undefined) {
            const trimmedName = name.trim();

            // Check for duplicates in the same category (or current category if not changing)
            let catToCheck = categoryId;
            if (!catToCheck) {
                const currentItem = await db.prepare(`SELECT category_id FROM items WHERE id = ?`).bind(id).first();
                catToCheck = currentItem?.category_id as string;
            }

            const existing = await db.prepare(`SELECT id FROM items WHERE name = ? AND category_id = ? AND id != ? AND is_deleted = 0 COLLATE NOCASE`)
                .bind(trimmedName, catToCheck, id).first();

            if (existing) {
                return NextResponse.json({ error: 'Nama barang sudah ada di kategori ini' }, { status: 400 });
            }

            updates.push('name = ?');
            values.push(trimmedName);
        }
        if (categoryId !== undefined) {
            updates.push('category_id = ?');
            values.push(categoryId);
        }
        if (price !== undefined) {
            updates.push('price = ?');
            values.push(price);
        }

        // Direct Stock Adjustment (Correction)
        if (adjustment !== undefined) {
            const currentItem = await db.prepare(`SELECT current_stock FROM items WHERE id = ?`).bind(id).first();
            const oldStock = (currentItem?.current_stock as number) || 0;
            const newStock = adjustment;
            const diff = newStock - oldStock;

            if (diff !== 0) {
                updates.push('current_stock = ?');
                values.push(newStock);

                // Create audit trail transaction
                const txId = crypto.randomUUID();
                const txType = diff > 0 ? 'IN' : 'OUT';
                const txQty = Math.abs(diff);
                await db.prepare(`
                    INSERT INTO transactions (id, item_id, type, quantity, notes, sync_status)
                    VALUES (?, ?, ?, ?, ?, 'SYNCED')
                `).bind(txId, id, txType, txQty, '[ADJUSTMENT] Koreksi Stok').run();
            }
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        updates.push('last_updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        await db.prepare(`
            UPDATE items SET ${updates.join(', ')} WHERE id = ? AND is_deleted = 0
        `).bind(...values).run();

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error updating item:', err);
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}

// DELETE item
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

        const currentItem = await db.prepare(`SELECT name, code FROM items WHERE id = ?`).bind(id).first();
        if (currentItem) {
            const timestamp = Date.now();
            const newName = `${currentItem.name}-DEL-${timestamp}`;
            const newCode = `${currentItem.code}-DEL-${timestamp}`;

            await db.prepare(`
                UPDATE items SET is_deleted = 1, name = ?, code = ? WHERE id = ?
            `).bind(newName, newCode, id).run();
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error deleting item:', err);
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
}

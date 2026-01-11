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
            SELECT i.*, c.name as category_name 
            FROM items i 
            LEFT JOIN categories c ON i.category_id = c.id 
            ORDER BY i.last_updated_at DESC
        `).all();

        // Transform snake_case to camelCase
        const items = result.results.map((row: Record<string, unknown>) => ({
            id: row.id,
            code: row.code,
            name: row.name,
            categoryId: row.category_id,
            categoryName: row.category_name,
            currentStock: row.current_stock,
            unit: row.unit,
            lastUpdatedAt: row.last_updated_at
        }));

        return NextResponse.json(items);
    } catch (err) {
        console.error('Error fetching items:', err);
        return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }
}

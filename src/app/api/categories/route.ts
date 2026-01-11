import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET() {
    try {
        const { env } = await getCloudflareContext();
        const db = env.DB;

        if (!db) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        const result = await db.prepare('SELECT * FROM categories ORDER BY name').all();

        // Transform snake_case to camelCase
        const categories = result.results.map((row: Record<string, unknown>) => ({
            id: row.id,
            name: row.name,
            createdAt: row.created_at
        }));

        return NextResponse.json(categories);
    } catch (err) {
        console.error('Error fetching categories:', err);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

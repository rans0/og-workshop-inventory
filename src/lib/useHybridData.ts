'use client';

import { useState, useEffect, useCallback } from 'react';
import { db, type Category, type Item, type Transaction } from './db';

type DataType = 'categories' | 'items' | 'transactions';

interface UseHybridDataOptions {
    fallbackToLocal?: boolean;
}

export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Check initial state
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

export function useHybridData<T>(
    dataType: DataType,
    options: UseHybridDataOptions = { fallbackToLocal: true }
) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [source, setSource] = useState<'cloud' | 'local'>('local');
    const isOnline = useOnlineStatus();

    const fetchFromCloud = useCallback(async (): Promise<T[] | null> => {
        try {
            const response = await fetch(`/api/${dataType}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const cloudData = await response.json();
            return cloudData;
        } catch (err) {
            console.error(`Failed to fetch ${dataType} from cloud:`, err);
            return null;
        }
    }, [dataType]);

    const fetchFromLocal = useCallback(async (): Promise<T[]> => {
        const table = db[dataType];
        return await table.toArray() as T[];
    }, [dataType]);

    const syncToLocal = useCallback(async (cloudData: T[]) => {
        // Clear existing and replace with cloud data
        if (dataType === 'categories') {
            await db.categories.clear();
            const transformed = cloudData.map((item) => {
                const i = item as Record<string, unknown>;
                return {
                    id: i.id as string,
                    name: i.name as string,
                    createdAt: i.createdAt ? new Date(i.createdAt as string) : new Date()
                };
            });
            await db.categories.bulkPut(transformed);
        } else if (dataType === 'items') {
            await db.items.clear();
            const transformed = cloudData.map((item) => {
                const i = item as Record<string, unknown>;
                return {
                    id: i.id as string,
                    code: i.code as string,
                    name: i.name as string,
                    categoryId: i.categoryId as string,
                    currentStock: i.currentStock as number,
                    unit: (i.unit as string) || 'pcs',
                    lastUpdatedAt: i.lastUpdatedAt ? new Date(i.lastUpdatedAt as string) : new Date()
                };
            });
            await db.items.bulkPut(transformed);
        } else if (dataType === 'transactions') {
            await db.transactions.clear();
            const transformed = cloudData.map((item) => {
                const i = item as Record<string, unknown>;
                return {
                    id: i.id as string,
                    itemId: i.itemId as string,
                    type: i.type as 'IN' | 'OUT',
                    quantity: i.quantity as number,
                    notes: i.notes as string | undefined,
                    createdAt: i.createdAt ? new Date(i.createdAt as string) : new Date(),
                    syncStatus: 'SYNCED' as const
                };
            });
            await db.transactions.bulkPut(transformed);
        }
    }, [dataType]);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (isOnline) {
            const cloudData = await fetchFromCloud();
            if (cloudData) {
                setData(cloudData);
                setSource('cloud');
                // Cache to local
                await syncToLocal(cloudData);
            } else if (options.fallbackToLocal) {
                const localData = await fetchFromLocal();
                setData(localData);
                setSource('local');
                setError('Cloud unavailable, using local data');
            }
        } else {
            const localData = await fetchFromLocal();
            setData(localData);
            setSource('local');
        }

        setLoading(false);
    }, [isOnline, fetchFromCloud, fetchFromLocal, syncToLocal, options.fallbackToLocal]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { data, loading, error, source, isOnline, refresh };
}

// Typed convenience hooks
export function useCategories() {
    return useHybridData<Category>('categories');
}

export function useItems() {
    return useHybridData<Item>('items');
}

export function useTransactions() {
    return useHybridData<Transaction>('transactions');
}

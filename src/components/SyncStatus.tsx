'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { CloudOff, CloudSync, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SyncStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);

    const pendingTransactions = useLiveQuery(() =>
        db.transactions.where('syncStatus').equals('PENDING').count()
    );

    useEffect(() => {
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

    const triggerSync = async () => {
        if (!isOnline || syncing || !pendingTransactions) return;

        setSyncing(true);
        try {
            const categories = await db.categories.toArray();
            const items = await db.items.toArray();
            const transactions = await db.transactions.toArray();

            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categories, items, transactions })
            });

            if (res.ok) {
                // Mark all as synced for now in this simple implementation
                await db.transactions.where('syncStatus').equals('PENDING').modify({ syncStatus: 'SYNCED' });
                setLastSync(new Date());
            }
        } catch (err) {
            console.error('Manual sync failed:', err);
        } finally {
            setSyncing(false);
        }
    };

    if (!isOnline) {
        return (
            <div className="bg-orange-50 text-orange-700 p-4 rounded-2xl border-2 border-orange-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <CloudOff className="w-6 h-6" />
                    <span className="font-bold">Mode Offline (Bisa Tetap Input)</span>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={triggerSync}
            disabled={syncing || !pendingTransactions}
            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${pendingTransactions
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-green-50 border-green-200 text-green-700 opacity-60'
                }`}
        >
            <div className="flex items-center gap-3">
                {pendingTransactions ? <CloudSync className={syncing ? 'animate-spin' : ''} /> : <CheckCircle2 />}
                <span className="font-bold">
                    {syncing ? 'Sedang Sinkronisasi...' :
                        pendingTransactions ? `Ada ${pendingTransactions} data belum terkirim` :
                            'Semua Data Aman di Cloud'}
                </span>
            </div>
            {pendingTransactions && !syncing && <span className="text-sm font-black underline">KIRIM SEKARANG</span>}
        </button>
    );
}

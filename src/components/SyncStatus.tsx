'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Upload, Download, Wifi, WifiOff, CheckCircle } from 'lucide-react';

export default function SyncStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [pulling, setPulling] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [autoSyncMessage, setAutoSyncMessage] = useState<string | null>(null);
    const wasOffline = useRef(false);

    const pendingTransactions = useLiveQuery(() =>
        db.transactions.where('syncStatus').equals('PENDING').count()
    );

    // Push local data to cloud
    const pushToCloud = useCallback(async (isAutoSync = false) => {
        if (syncing) return;

        // Check pendingTransactions from DB directly for auto-sync
        const pendingCount = await db.transactions.where('syncStatus').equals('PENDING').count();
        if (pendingCount === 0) return;

        setSyncing(true);
        if (isAutoSync) {
            setAutoSyncMessage('Auto-sync: Mengirim data...');
        }

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
                await db.transactions.where('syncStatus').equals('PENDING').modify({ syncStatus: 'SYNCED' });
                const now = new Date();
                setLastSync(now);
                localStorage.setItem('lastSyncTime', now.toISOString());

                if (isAutoSync) {
                    setAutoSyncMessage('✓ Auto-sync berhasil!');
                    setTimeout(() => setAutoSyncMessage(null), 3000);
                }
            }
        } catch (err) {
            console.error('Push sync failed:', err);
            if (isAutoSync) {
                setAutoSyncMessage('Auto-sync gagal, coba manual');
                setTimeout(() => setAutoSyncMessage(null), 5000);
            }
        } finally {
            setSyncing(false);
        }
    }, [syncing]);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            // Auto-sync when coming back online from offline
            if (wasOffline.current) {
                wasOffline.current = false;
                // Small delay to ensure network is stable
                setTimeout(() => {
                    pushToCloud(true);
                }, 1000);
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            wasOffline.current = true;
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Load last sync time from localStorage
        const saved = localStorage.getItem('lastSyncTime');
        if (saved) setLastSync(new Date(saved));

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [pushToCloud]);

    // Pull data from cloud to local
    const pullFromCloud = useCallback(async () => {
        if (!isOnline || pulling) return;

        setPulling(true);
        try {
            // Fetch all data from cloud
            const [categoriesRes, itemsRes, transactionsRes] = await Promise.all([
                fetch('/api/categories'),
                fetch('/api/items'),
                fetch('/api/transactions')
            ]);

            if (categoriesRes.ok && itemsRes.ok && transactionsRes.ok) {
                const categories = await categoriesRes.json();
                const items = await itemsRes.json();
                const transactions = await transactionsRes.json();

                // Clear and replace local data
                await db.categories.clear();
                await db.items.clear();
                // Don't clear transactions with PENDING status
                await db.transactions.where('syncStatus').equals('SYNCED').delete();

                // Insert cloud data with transformed dates
                if (categories.length > 0) {
                    const cats = categories.map((c: Record<string, unknown>) => ({
                        ...c,
                        createdAt: c.createdAt ? new Date(c.createdAt as string) : new Date()
                    }));
                    await db.categories.bulkPut(cats);
                }

                if (items.length > 0) {
                    const itms = items.map((i: Record<string, unknown>) => ({
                        ...i,
                        lastUpdatedAt: i.lastUpdatedAt ? new Date(i.lastUpdatedAt as string) : new Date()
                    }));
                    await db.items.bulkPut(itms);
                }

                if (transactions.length > 0) {
                    const txs = transactions.map((t: Record<string, unknown>) => ({
                        ...t,
                        createdAt: t.createdAt ? new Date(t.createdAt as string) : new Date(),
                        syncStatus: 'SYNCED'
                    }));
                    await db.transactions.bulkPut(txs);
                }

                const now = new Date();
                setLastSync(now);
                localStorage.setItem('lastSyncTime', now.toISOString());
            }
        } catch (err) {
            console.error('Pull sync failed:', err);
        } finally {
            setPulling(false);
        }
    }, [isOnline, pulling]);

    const formatLastSync = () => {
        if (!lastSync) return 'Belum pernah';
        const now = new Date();
        const diff = now.getTime() - lastSync.getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Baru saja';
        if (minutes < 60) return `${minutes} menit lalu`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} jam lalu`;
        return lastSync.toLocaleDateString();
    };

    return (
        <div className="space-y-3">
            {/* Auto-sync Message */}
            {autoSyncMessage && (
                <div className="flex items-center gap-2 p-3 bg-blue-100 border-2 border-blue-200 rounded-2xl text-blue-700 font-bold animate-pulse">
                    <CheckCircle className="w-5 h-5" />
                    {autoSyncMessage}
                </div>
            )}

            {/* Online/Offline Status Bar */}
            <div className={`flex items-center justify-between p-3 rounded-2xl border-2 ${isOnline
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                <div className="flex items-center gap-2">
                    {isOnline ? (
                        <>
                            <Wifi className="w-5 h-5" />
                            <span className="font-bold">Online</span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-5 h-5" />
                            <span className="font-bold">Offline — Data disimpan lokal</span>
                        </>
                    )}
                </div>
                <span className="text-sm opacity-70">Sync: {formatLastSync()}</span>
            </div>

            {/* Sync Actions */}
            {isOnline && (
                <div className="grid grid-cols-2 gap-3">
                    {/* Pull from Cloud */}
                    <button
                        onClick={pullFromCloud}
                        disabled={pulling}
                        className="flex items-center justify-center gap-2 p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl text-blue-700 font-bold active:scale-95 transition-all disabled:opacity-50"
                    >
                        <Download className={`w-5 h-5 ${pulling ? 'animate-bounce' : ''}`} />
                        {pulling ? 'Mengambil...' : 'Ambil dari Cloud'}
                    </button>

                    {/* Push to Cloud */}
                    <button
                        onClick={() => pushToCloud(false)}
                        disabled={syncing || !pendingTransactions}
                        className={`flex items-center justify-center gap-2 p-4 rounded-2xl font-bold active:scale-95 transition-all disabled:opacity-50 ${pendingTransactions
                            ? 'bg-orange-50 border-2 border-orange-200 text-orange-700'
                            : 'bg-gray-50 border-2 border-gray-200 text-gray-500'
                            }`}
                    >
                        <Upload className={`w-5 h-5 ${syncing ? 'animate-bounce' : ''}`} />
                        {syncing ? 'Mengirim...' : pendingTransactions ? `Kirim (${pendingTransactions})` : 'Semua Terkirim'}
                    </button>
                </div>
            )}
        </div>
    );
}

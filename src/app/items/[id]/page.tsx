'use client';

import React, { useState, useEffect, use } from 'react';
import { ArrowLeft, Package, Calendar, TrendingUp, History as HistoryIcon, PlusCircle, MinusCircle, Pencil } from 'lucide-react';
import Link from 'next/link';
import QuickActionModal from '@/components/QuickActionModal';

interface ItemDetail {
    id: string;
    code: string;
    name: string;
    categoryId: string;
    categoryName: string;
    currentStock: number;
    unit: string;
    price: number;
    lastUpdatedAt: string;
}

interface Transaction {
    id: string;
    type: 'IN' | 'OUT';
    quantity: number;
    notes: string;
    createdAt: string;
    // Accounting fields
    itemPrice: number;
    runningQty: number;
    runningValue: number;
    avgPrice: number;
}

export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [item, setItem] = useState<ItemDetail | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showQuickAction, setShowQuickAction] = useState(false);

    const fetchData = React.useCallback(async () => {
        try {
            const [itemRes, txRes] = await Promise.all([
                fetch(`/api/items/${id}?t=${Date.now()}`),
                fetch(`/api/transactions?itemId=${id}&limit=50&t=${Date.now()}`)
            ]);

            if (itemRes.ok) {
                setItem(await itemRes.json());
            }
            if (txRes.ok) {
                setTransactions(await txRes.json());
            }
        } catch (err) {
            console.error('Failed to fetch item details:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    if (loading) {
        return (
            <main className="max-w-4xl mx-auto p-4 sm:p-6">
                <p className="text-center text-slate-400 py-20">Memuat...</p>
            </main>
        );
    }

    if (!item) {
        return (
            <main className="max-w-4xl mx-auto p-4 sm:p-6">
                <div className="text-center py-20 space-y-4">
                    <Package className="w-20 h-20 mx-auto text-slate-200" />
                    <p className="text-xl font-bold text-slate-400">Barang tidak ditemukan</p>
                    <Link href="/items" className="text-blue-500 font-bold hover:underline inline-block">
                        Kembali ke Daftar Barang
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
            <header className="flex items-center gap-3 sm:gap-4">
                <Link href="/items" className="p-2 sm:p-3 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform">
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-3xl font-black text-slate-900 truncate">{item.name}</h1>
                    <p className="text-xs sm:text-base font-bold text-slate-500 flex items-center gap-2">
                        <span className="font-mono bg-slate-100 px-1.5 rounded uppercase tracking-wider">{item.code}</span>
                        <span>•</span>
                        <span className="text-blue-600">{item.categoryName}</span>
                    </p>
                </div>
            </header>

            {/* Main Stats Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card !bg-slate-900 !text-white !p-6 sm:!p-10 space-y-4 relative overflow-hidden flex flex-col justify-center min-h-[160px]">
                    <div className="relative z-10">
                        <p className="text-slate-400 font-bold text-xs sm:text-sm uppercase tracking-[0.2em] mb-1">STOK SAAT INI</p>
                        <div className="flex items-baseline gap-3">
                            <h2 className="text-6xl sm:text-8xl font-black tabular-nums">
                                {item.currentStock ?? 0}
                            </h2>
                            <span className="text-2xl sm:text-3xl font-bold text-slate-500 uppercase tracking-tight">
                                {item.unit || 'pcs'}
                            </span>
                        </div>
                    </div>
                    <Package className="absolute -right-8 -bottom-8 w-48 h-48 text-white/[0.03] -rotate-12" />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="card flex items-center gap-4 !p-4 sm:!p-6">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">HARGA SATUAN</p>
                            <p className="text-xl sm:text-2xl font-black text-slate-800">
                                {item.price > 0 ? formatPrice(item.price) : '-'}
                            </p>
                        </div>
                    </div>

                    {/* Accounting Info Card */}
                    {transactions.length > 0 && (
                        <div className="card !p-4 sm:!p-6 space-y-3">
                            <div className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-slate-400" />
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Nilai Stok (Average Cost)</p>
                            </div>
                            {(() => {
                                const lastTx = transactions[0];
                                const avgPrice = lastTx?.avgPrice || 0;
                                const runningValue = lastTx?.runningValue || 0;
                                const runningQty = lastTx?.runningQty || 0;
                                return (
                                    <>
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-medium text-slate-600">Harga Rata-rata:</span>
                                            <span className="text-lg font-black text-slate-800">{avgPrice > 0 ? formatPrice(avgPrice) : '-'}</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-medium text-slate-600">Total Nilai Stok:</span>
                                            <span className="text-lg font-black text-blue-700">{runningValue > 0 ? formatPrice(runningValue) : '-'}</span>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                                            {runningQty} unit @ {avgPrice > 0 ? formatPrice(avgPrice) : 'Rp 0'}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                    <Link
                        href={`/items?edit=${item.id}`}
                        className="card flex items-center justify-between !p-4 sm:!p-6 hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-50 rounded-xl">
                                <Pencil className="w-6 h-6 text-orange-600" />
                            </div>
                            <span className="text-lg font-bold text-slate-700">Edit Data Barang</span>
                        </div>
                        <ArrowLeft className="w-5 h-5 text-slate-300 rotate-180" />
                    </Link>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
                <button
                    onClick={() => setShowQuickAction(true)}
                    className="flex items-center justify-center gap-2 p-4 sm:p-6 bg-green-600 text-white rounded-2xl shadow-lg border-b-4 border-green-700 active:scale-95 active:border-b-0 transition-all font-black text-lg sm:text-xl"
                >
                    <PlusCircle className="w-6 h-6" />
                    BARANG MASUK
                </button>
                <button
                    onClick={() => setShowQuickAction(true)}
                    className="flex items-center justify-center gap-2 p-4 sm:p-6 bg-red-600 text-white rounded-2xl shadow-lg border-b-4 border-red-700 active:scale-95 active:border-b-0 transition-all font-black text-lg sm:text-xl"
                >
                    <MinusCircle className="w-6 h-6" />
                    BARANG KELUAR
                </button>
            </div>

            {/* Transaction History */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <HistoryIcon className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl sm:text-2xl font-bold">Riwayat Barang Ini</h2>
                </div>

                {transactions.length === 0 ? (
                    <div className="card !p-10 text-center opacity-50 border-dashed">
                        <p className="italic font-medium text-slate-400">Belum ada riwayat transaksi.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="card flex items-center gap-4 !p-4 sm:!p-5">
                                <div className={`p-2 sm:p-3 rounded-xl ${tx.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-bold text-slate-400 flex items-center gap-1.5 mb-0.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(tx.createdAt.includes('T') ? tx.createdAt : tx.createdAt.replace(' ', 'T') + 'Z').toLocaleString('id-ID', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            timeZone: 'Asia/Jakarta'
                                        })}
                                    </p>
                                    <p className="text-slate-800 font-bold truncate leading-snug">
                                        {tx.notes || (tx.type === 'IN' ? 'Barang Masuk' : 'Barang Keluar')}
                                    </p>
                                </div>
                                <div className="text-right pl-4 border-l border-slate-100">
                                    <p className={`text-xl sm:text-2xl font-black ${tx.type === 'IN' ? 'text-green-600' : 'text-red-700'}`}>
                                        {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                                    </p>
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">pcs</p>
                                    {tx.itemPrice > 0 && (
                                        <p className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1">
                                            @ {formatPrice(tx.itemPrice)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Quick Action Modal */}
            {showQuickAction && (
                <QuickActionModal
                    item={{
                        id: item.id,
                        code: item.code,
                        name: item.name,
                        currentStock: item.currentStock
                    }}
                    onRefresh={fetchData}
                    onClose={() => setShowQuickAction(false)}
                />
            )}
        </main>
    );
}

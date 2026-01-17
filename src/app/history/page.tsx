'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Calendar, Package } from 'lucide-react';
import Link from 'next/link';
import QuickActionModal, { Item } from '@/components/QuickActionModal';

interface Transaction {
    id: string;
    itemId: string;
    itemName: string;
    itemCode: string;
    itemStock: number;
    type: 'IN' | 'OUT';
    quantity: number;
    notes: string;
    createdAt: string;
}

export default function HistoryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/transactions?limit=200');
            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            }
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const filteredTransactions = transactions.filter(tx =>
        tx.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
            <header className="flex items-center gap-3 sm:gap-4">
                <Link href="/" className="p-2 sm:p-3 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform">
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
                <h1 className="text-xl sm:text-3xl font-bold">Riwayat Transaksi</h1>
            </header>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 sm:w-6 sm:h-6" />
                <input
                    placeholder="Cari barang atau catatan..."
                    className="!pl-12 sm:!pl-16 !p-4 sm:!p-5 !text-lg sm:!text-2xl font-medium focus:!border-blue-500 focus:!ring-4 focus:!ring-blue-100 transition-all border-2 border-slate-100 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <p className="text-center text-slate-400 py-20">Memuat...</p>
            ) : filteredTransactions.length === 0 ? (
                <div className="card text-center py-20 opacity-50">
                    <p className="text-xl font-bold text-slate-400 italic">Tidak ada riwayat ditemukan.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTransactions.map((tx) => (
                        <button
                            key={tx.id}
                            onClick={() => setSelectedItem({
                                id: tx.itemId,
                                name: tx.itemName,
                                code: tx.itemCode,
                                currentStock: tx.itemStock
                            })}
                            className="w-full card flex items-center gap-3 sm:gap-6 !p-4 sm:!p-6 text-left active:bg-slate-50 transition-colors"
                        >
                            <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${tx.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                <Package className="w-6 h-6 sm:w-8 sm:h-8" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <span className={`text-[10px] sm:text-sm font-black px-2.5 py-1 rounded uppercase tracking-wide ${tx.type === 'IN' ? 'bg-green-600 text-white' : 'bg-red-700 text-white'}`}>
                                        {tx.type === 'IN' ? 'Masuk' : 'Keluar'}
                                    </span>
                                    <span className="text-xs sm:text-base text-slate-500 font-bold flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg">
                                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                                        {new Date(tx.createdAt.includes('T') ? tx.createdAt : tx.createdAt.replace(' ', 'T') + 'Z').toLocaleString('id-ID', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            timeZone: 'Asia/Jakarta'
                                        })}
                                    </span>
                                </div>
                                <h3 className="text-lg sm:text-2xl font-black text-slate-900 truncate">{tx.itemName || 'Barang Terhapus'}</h3>
                                {tx.notes && <p className="text-slate-600 font-bold italic text-xs sm:text-lg mt-1 truncate">&quot;{tx.notes}&quot;</p>}
                            </div>
                            <div className="text-right shrink-0 border-l-2 border-slate-50 pl-4 sm:pl-8">
                                <p className={`text-2xl sm:text-4xl font-black leading-tight ${tx.type === 'IN' ? 'text-green-600' : 'text-red-700'}`}>
                                    {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                                </p>
                                <p className="text-xs sm:text-base font-black text-slate-400 uppercase tracking-widest mt-0.5">pcs</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {selectedItem && (
                <QuickActionModal
                    item={selectedItem}
                    onRefresh={fetchTransactions}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </main>
    );
}

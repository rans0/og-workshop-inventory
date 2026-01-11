'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Calendar, Package } from 'lucide-react';
import Link from 'next/link';

interface Transaction {
    id: string;
    itemId: string;
    itemName: string;
    itemCode: string;
    type: 'IN' | 'OUT';
    quantity: number;
    notes: string;
    createdAt: string;
}

export default function HistoryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
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
                    className="!pl-12 sm:!pl-14 !p-3 sm:!p-5"
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
                        <div key={tx.id} className="card flex items-center gap-3 sm:gap-6 !p-4 sm:!p-6">
                            <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${tx.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                <Package className="w-6 h-6 sm:w-8 sm:h-8" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded uppercase ${tx.type === 'IN' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                        {tx.type === 'IN' ? 'Masuk' : 'Keluar'}
                                    </span>
                                    <span className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(tx.createdAt).toLocaleString('id-ID', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <h3 className="text-base sm:text-xl font-bold text-slate-800 truncate">{tx.itemName || 'Barang Terhapus'}</h3>
                                {tx.notes && <p className="text-slate-500 italic text-xs sm:text-sm mt-1 truncate">&quot;{tx.notes}&quot;</p>}
                            </div>
                            <div className="text-right shrink-0">
                                <p className={`text-xl sm:text-2xl font-black ${tx.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                                </p>
                                <p className="text-[10px] sm:text-xs font-bold text-slate-400">pcs</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}

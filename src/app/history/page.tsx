'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ArrowLeft, Search, Calendar, Package } from 'lucide-react';
import Link from 'next/link';

export default function HistoryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const items = useLiveQuery(() => db.items.toArray());
    const transactions = useLiveQuery(() =>
        db.transactions.orderBy('createdAt').reverse().toArray()
    );

    const filteredTransactions = transactions?.filter(tx => {
        const item = items?.find(i => i.id === tx.itemId);
        return item?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <main className="max-w-4xl mx-auto p-6 space-y-8">
            <header className="flex items-center gap-4">
                <Link href="/" className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-3xl font-bold">Riwayat Transaksi</h1>
            </header>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
                <input
                    placeholder="Cari barang atau catatan..."
                    className="pl-14"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="space-y-4">
                {filteredTransactions?.map((tx) => {
                    const item = items?.find(i => i.id === tx.itemId);
                    return (
                        <div key={tx.id} className="card flex items-center gap-6">
                            <div className={`p-4 rounded-2xl ${tx.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {tx.type === 'IN' ? <Package className="w-8 h-8" /> : <Package className="w-8 h-8 opacity-50" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${tx.type === 'IN' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                                        }`}>
                                        {tx.type === 'IN' ? 'Masuk' : 'Keluar'}
                                    </span>
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(tx.createdAt).toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">{item?.name || 'Barang Terhapus'}</h3>
                                {tx.notes && <p className="text-slate-500 italic text-sm mt-1">"{tx.notes}"</p>}
                            </div>
                            <div className="text-right">
                                <p className={`text-2xl font-black ${tx.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                                </p>
                                <p className="text-xs font-bold text-slate-400">pcs</p>
                            </div>
                        </div>
                    );
                })}
                {filteredTransactions?.length === 0 && (
                    <div className="card text-center py-20 opacity-50">
                        <p className="text-xl font-bold text-slate-400 italic">Tidak ada riwayat ditemukan.</p>
                    </div>
                )}
            </div>
        </main>
    );
}

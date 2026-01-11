'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ArrowLeft, TrendingUp, TrendingDown, Package } from 'lucide-react';
import Link from 'next/link';

type ReportTab = 'daily' | 'monthly' | 'yearly';

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<ReportTab>('daily');
    const items = useLiveQuery(() => db.items.toArray());
    const transactions = useLiveQuery(() => db.transactions.toArray());

    const getFilteredTransactions = () => {
        if (!transactions) return [];
        const now = new Date();

        return transactions.filter(tx => {
            const txDate = new Date(tx.createdAt);
            if (activeTab === 'daily') {
                return txDate.toDateString() === now.toDateString();
            } else if (activeTab === 'monthly') {
                return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
            } else if (activeTab === 'yearly') {
                return txDate.getFullYear() === now.getFullYear();
            }
            return true;
        });
    };

    const filtered = getFilteredTransactions();
    const totalIn = filtered.filter(tx => tx.type === 'IN').reduce((acc, tx) => acc + tx.quantity, 0);
    const totalOut = filtered.filter(tx => tx.type === 'OUT').reduce((acc, tx) => acc + tx.quantity, 0);

    // Group by item
    const itemSummary = filtered.reduce((acc, tx) => {
        if (!acc[tx.itemId]) acc[tx.itemId] = { in: 0, out: 0 };
        if (tx.type === 'IN') acc[tx.itemId].in += tx.quantity;
        else acc[tx.itemId].out += tx.quantity;
        return acc;
    }, {} as Record<string, { in: number, out: number }>);

    return (
        <main className="max-w-4xl mx-auto p-6 space-y-8 pb-20">
            <header className="flex items-center gap-4">
                <Link href="/" className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-3xl font-bold">Laporan Stok</h1>
            </header>

            {/* Tab Switcher - Big & Easy to Press */}
            <div className="flex p-2 bg-slate-200 rounded-[2rem] gap-2">
                {(['daily', 'monthly', 'yearly'] as ReportTab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 p-4 rounded-[1.5rem] font-black text-lg transition-all ${activeTab === tab
                            ? 'bg-white text-blue-600 shadow-md scale-105'
                            : 'text-slate-500 hover:bg-slate-300'
                            }`}
                    >
                        {tab === 'daily' ? 'HARIAN' : tab === 'monthly' ? 'BULANAN' : 'TAHUNAN'}
                    </button>
                ))}
            </div>

            {/* Key Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card border-green-100 bg-green-50/30 flex items-center gap-6 p-8">
                    <div className="p-4 bg-green-100 text-green-600 rounded-2xl">
                        <TrendingUp className="w-10 h-10" />
                    </div>
                    <div>
                        <p className="text-green-800 font-bold uppercase text-sm tracking-widest">Total Masuk</p>
                        <p className="text-5xl font-black text-green-600">{totalIn}</p>
                        <p className="text-xs font-bold text-green-700">pcs</p>
                    </div>
                </div>
                <div className="card border-red-100 bg-red-50/30 flex items-center gap-6 p-8">
                    <div className="p-4 bg-red-100 text-red-600 rounded-2xl">
                        <TrendingDown className="w-10 h-10" />
                    </div>
                    <div>
                        <p className="text-red-800 font-bold uppercase text-sm tracking-widest">Total Keluar</p>
                        <p className="text-5xl font-black text-red-600">{totalOut}</p>
                        <p className="text-xs font-bold text-red-700">pcs</p>
                    </div>
                </div>
            </div>

            {/* Breakdown Section */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Package className="w-6 h-6 text-blue-600" />
                    Rincian Per Barang
                </h2>
                <div className="space-y-3">
                    {Object.entries(itemSummary).map(([itemId, stats]) => {
                        const item = items?.find(i => i.id === itemId);
                        return (
                            <div key={itemId} className="card flex items-center justify-between p-6">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-800">{item?.name || 'Barang Terhapus'}</h3>
                                    <p className="text-sm font-bold text-slate-400 uppercase">{item?.code}</p>
                                </div>
                                <div className="flex gap-4 text-center">
                                    <div className="px-4 border-r border-slate-100">
                                        <p className="text-xs font-bold text-slate-400">MASUK</p>
                                        <p className="text-2xl font-black text-green-600">{stats.in}</p>
                                    </div>
                                    <div className="px-4">
                                        <p className="text-xs font-bold text-slate-400">KELUAR</p>
                                        <p className="text-2xl font-black text-red-600">{stats.out}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {Object.keys(itemSummary).length === 0 && (
                        <div className="card text-center py-20 opacity-50 italic">
                            Tidak ada data untuk periode ini.
                        </div>
                    )}
                </div>
            </section>

            {/* Info Alert */}
            <div className="bg-blue-50 border-2 border-blue-100 p-6 rounded-[2rem] flex gap-4 items-start">
                <TrendingUp className="w-8 h-8 text-blue-600 shrink-0" />
                <p className="text-blue-800 font-medium">
                    Laporan ini membantu Anda melihat tren pemakaian barang. Jika angka <b>Keluar</b> tinggi secara konsisten, pertimbangkan untuk menambah stok cadangan.
                </p>
            </div>
        </main>
    );
}

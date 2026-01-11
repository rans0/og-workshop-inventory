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

    const getPeriodLabel = () => {
        const now = new Date();
        if (activeTab === 'daily') {
            return now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
        } else if (activeTab === 'monthly') {
            return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        } else {
            return `Tahun ${now.getFullYear()}`;
        }
    };

    return (
        <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
            <header className="flex items-center gap-3 sm:gap-4">
                <Link href="/" className="p-2 sm:p-3 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform">
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-3xl font-bold">Laporan Stok</h1>
                    <p className="text-xs sm:text-sm text-slate-500">{getPeriodLabel()}</p>
                </div>
            </header>

            {/* Tab Switcher - Mobile Optimized */}
            <div className="flex p-1.5 sm:p-2 bg-slate-200 rounded-2xl gap-1 sm:gap-2">
                {(['daily', 'monthly', 'yearly'] as ReportTab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 p-3 sm:p-4 rounded-xl sm:rounded-[1.5rem] font-bold text-sm sm:text-lg transition-all ${activeTab === tab
                            ? 'bg-white text-blue-600 shadow-md'
                            : 'text-slate-500'
                            }`}
                    >
                        {tab === 'daily' ? 'Hari' : tab === 'monthly' ? 'Bulan' : 'Tahun'}
                    </button>
                ))}
            </div>

            {/* Key Stats Card - Mobile Optimized */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="card border-green-100 bg-green-50/30 flex items-center gap-3 sm:gap-6 !p-4 sm:!p-8">
                    <div className="p-2 sm:p-4 bg-green-100 text-green-600 rounded-xl sm:rounded-2xl">
                        <TrendingUp className="w-6 h-6 sm:w-10 sm:h-10" />
                    </div>
                    <div>
                        <p className="text-green-800 font-bold uppercase text-[10px] sm:text-sm tracking-wider">Masuk</p>
                        <p className="text-2xl sm:text-5xl font-black text-green-600">{totalIn}</p>
                    </div>
                </div>
                <div className="card border-red-100 bg-red-50/30 flex items-center gap-3 sm:gap-6 !p-4 sm:!p-8">
                    <div className="p-2 sm:p-4 bg-red-100 text-red-600 rounded-xl sm:rounded-2xl">
                        <TrendingDown className="w-6 h-6 sm:w-10 sm:h-10" />
                    </div>
                    <div>
                        <p className="text-red-800 font-bold uppercase text-[10px] sm:text-sm tracking-wider">Keluar</p>
                        <p className="text-2xl sm:text-5xl font-black text-red-600">{totalOut}</p>
                    </div>
                </div>
            </div>

            {/* Breakdown Section - Mobile Optimized */}
            <section className="space-y-3 sm:space-y-4">
                <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    Rincian Per Barang
                </h2>
                <div className="space-y-2 sm:space-y-3">
                    {Object.entries(itemSummary).map(([itemId, stats]) => {
                        const item = items?.find(i => i.id === itemId);
                        return (
                            <div key={itemId} className="card flex items-center justify-between !p-4 sm:!p-6">
                                <div className="flex-1 min-w-0 mr-3">
                                    <h3 className="text-base sm:text-xl font-bold text-slate-800 truncate">{item?.name || 'Barang Terhapus'}</h3>
                                    <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase">{item?.code}</p>
                                </div>
                                <div className="flex gap-3 sm:gap-4 text-center shrink-0">
                                    <div className="px-2 sm:px-4 border-r border-slate-100">
                                        <p className="text-[10px] sm:text-xs font-bold text-slate-400">IN</p>
                                        <p className="text-lg sm:text-2xl font-black text-green-600">{stats.in}</p>
                                    </div>
                                    <div className="px-2 sm:px-4">
                                        <p className="text-[10px] sm:text-xs font-bold text-slate-400">OUT</p>
                                        <p className="text-lg sm:text-2xl font-black text-red-600">{stats.out}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {Object.keys(itemSummary).length === 0 && (
                        <div className="card text-center py-12 sm:py-20 opacity-50 italic text-sm">
                            Tidak ada data untuk periode ini.
                        </div>
                    )}
                </div>
            </section>

            {/* Info Alert - Mobile Optimized */}
            <div className="bg-blue-50 border-2 border-blue-100 p-4 sm:p-6 rounded-2xl flex gap-3 sm:gap-4 items-start">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 shrink-0" />
                <p className="text-blue-800 font-medium text-xs sm:text-base">
                    Jika <b>Keluar</b> tinggi secara konsisten, pertimbangkan untuk menambah stok cadangan.
                </p>
            </div>
        </main>
    );
}

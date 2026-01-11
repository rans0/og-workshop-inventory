'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Package } from 'lucide-react';
import Link from 'next/link';

type ReportTab = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

interface Transaction {
    id: string;
    itemId: string;
    itemName: string;
    itemCode: string;
    itemPrice: number;
    categoryId: string;
    categoryName: string;
    type: 'IN' | 'OUT';
    quantity: number;
    createdAt: string;
}

interface CategorySummary {
    categoryId: string;
    categoryName: string;
    items: {
        id: string;
        name: string;
        code: string;
        price: number;
        inQty: number;
        outQty: number;
        inValue: number;
        outValue: number;
    }[];
    totalIn: number;
    totalOut: number;
    totalInValue: number;
    totalOutValue: number;
    expanded: boolean;
}

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<ReportTab>('daily');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await fetch('/api/transactions?limit=1000');
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

    useEffect(() => {
        if (transactions.length === 0) return;

        const now = new Date();
        const filtered = transactions.filter(tx => {
            const txDate = new Date(tx.createdAt);

            if (activeTab === 'daily') {
                return txDate.toDateString() === now.toDateString();
            } else if (activeTab === 'weekly') {
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return txDate >= weekAgo;
            } else if (activeTab === 'monthly') {
                return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
            } else if (activeTab === 'yearly') {
                return txDate.getFullYear() === now.getFullYear();
            }
            return true; // 'all'
        });

        // Group by category
        const categoryMap = new Map<string, CategorySummary>();

        filtered.forEach(tx => {
            const categoryId = tx.categoryId || 'default';
            const categoryName = tx.categoryName || 'Tanpa Kategori';

            if (!categoryMap.has(categoryId)) {
                categoryMap.set(categoryId, {
                    categoryId,
                    categoryName,
                    items: [],
                    totalIn: 0,
                    totalOut: 0,
                    totalInValue: 0,
                    totalOutValue: 0,
                    expanded: false
                });
            }

            const category = categoryMap.get(categoryId)!;
            let item = category.items.find(i => i.id === tx.itemId);

            if (!item) {
                item = {
                    id: tx.itemId,
                    name: tx.itemName || 'Barang Terhapus',
                    code: tx.itemCode || '-',
                    price: tx.itemPrice || 0,
                    inQty: 0,
                    outQty: 0,
                    inValue: 0,
                    outValue: 0
                };
                category.items.push(item);
            }

            if (tx.type === 'IN') {
                item.inQty += tx.quantity;
                item.inValue += tx.quantity * (tx.itemPrice || 0);
                category.totalIn += tx.quantity;
                category.totalInValue += tx.quantity * (tx.itemPrice || 0);
            } else {
                item.outQty += tx.quantity;
                item.outValue += tx.quantity * (tx.itemPrice || 0);
                category.totalOut += tx.quantity;
                category.totalOutValue += tx.quantity * (tx.itemPrice || 0);
            }
        });

        setCategorySummaries(Array.from(categoryMap.values()));
    }, [transactions, activeTab]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    const toggleCategory = (categoryId: string) => {
        setCategorySummaries(prev => prev.map(cat =>
            cat.categoryId === categoryId ? { ...cat, expanded: !cat.expanded } : cat
        ));
    };

    const getPeriodLabel = () => {
        const now = new Date();
        switch (activeTab) {
            case 'daily': return now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
            case 'weekly': return '7 Hari Terakhir';
            case 'monthly': return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            case 'yearly': return `Tahun ${now.getFullYear()}`;
            default: return 'Semua Waktu';
        }
    };

    const grandTotalIn = categorySummaries.reduce((sum, cat) => sum + cat.totalIn, 0);
    const grandTotalOut = categorySummaries.reduce((sum, cat) => sum + cat.totalOut, 0);
    const grandTotalInValue = categorySummaries.reduce((sum, cat) => sum + cat.totalInValue, 0);
    const grandTotalOutValue = categorySummaries.reduce((sum, cat) => sum + cat.totalOutValue, 0);

    const tabLabels: Record<ReportTab, string> = {
        daily: 'Hari',
        weekly: 'Minggu',
        monthly: 'Bulan',
        yearly: 'Tahun',
        all: 'Semua'
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

            {/* Tab Switcher */}
            <div className="flex p-1 sm:p-1.5 bg-slate-200 rounded-xl sm:rounded-2xl gap-0.5 sm:gap-1 overflow-x-auto">
                {(Object.keys(tabLabels) as ReportTab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 min-w-[50px] p-2 sm:p-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all ${activeTab === tab
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500'
                            }`}
                    >
                        {tabLabels[tab]}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="text-center text-slate-400 py-20">Memuat...</p>
            ) : (
                <>
                    {/* Grand Total Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="card border-blue-100 bg-blue-50/30 !p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-blue-800 uppercase tracking-tight">Uang Modal (Belanja)</p>
                                    <p className="text-xl sm:text-2xl font-black text-blue-600 leading-none">
                                        {formatPrice(grandTotalInValue)}
                                    </p>
                                    <p className="text-[10px] text-blue-700 font-medium truncate mt-1">+{grandTotalIn} pcs masuk</p>
                                </div>
                            </div>
                        </div>
                        <div className="card border-orange-100 bg-orange-50/30 !p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                    <TrendingDown className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-orange-800 uppercase tracking-tight">Uang Keluar (Pemakaian)</p>
                                    <p className="text-xl sm:text-2xl font-black text-orange-600 leading-none">
                                        {formatPrice(grandTotalOutValue)}
                                    </p>
                                    <p className="text-[10px] text-orange-700 font-medium truncate mt-1">-{grandTotalOut} pcs keluar</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Category Summaries (Expandable) */}
                    <div className="space-y-3">
                        {categorySummaries.length === 0 ? (
                            <div className="card text-center py-12 text-slate-400 italic">
                                Tidak ada data untuk periode ini.
                            </div>
                        ) : (
                            categorySummaries.map(cat => (
                                <div key={cat.categoryId} className="card !p-0 overflow-hidden border-slate-200">
                                    {/* Category Header (Clickable) */}
                                    <button
                                        onClick={() => toggleCategory(cat.categoryId)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors bg-white"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold uppercase">
                                                {cat.categoryName.charAt(0)}
                                            </div>
                                            <div className="text-left">
                                                <h3 className="font-bold text-slate-800 leading-tight">{cat.categoryName}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat.items.length} Barang</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden sm:block">
                                                <div className="flex gap-4 text-xs font-bold">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Masuk</span>
                                                        <span className="text-green-600">+{cat.totalIn}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Keluar</span>
                                                        <span className="text-red-600">-{cat.totalOut}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-4 sm:gap-6">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Uang Modal</span>
                                                    <p className="font-bold text-sm text-blue-600">
                                                        {formatPrice(cat.totalInValue)}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Uang Keluar</span>
                                                    <p className="font-bold text-sm text-orange-600">
                                                        {formatPrice(cat.totalOutValue)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`p-1 rounded-full transition-transform ${cat.expanded ? 'bg-slate-100' : ''}`}>
                                                {cat.expanded ? (
                                                    <ChevronUp className="w-5 h-5 text-slate-500" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Expanded Items */}
                                    {cat.expanded && (
                                        <div className="border-t border-slate-100 bg-slate-50/50">
                                            {/* List Header */}
                                            <div className="px-4 py-2 border-b border-slate-100 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                <span className="flex-1">Barang</span>
                                                <div className="flex gap-4 sm:gap-6 shrink-0 w-[240px] sm:w-[320px] justify-end">
                                                    <span className="w-10 text-center">Masuk</span>
                                                    <span className="w-10 text-center">Keluar</span>
                                                    <span className="w-[80px] sm:w-[100px] text-right">Uang Modal</span>
                                                    <span className="w-[80px] sm:w-[100px] text-right">Uang Keluar</span>
                                                </div>
                                            </div>

                                            {cat.items.map(item => (
                                                <div key={item.id} className="p-4 border-b border-slate-100 last:border-b-0 flex items-center justify-between hover:bg-white/50 transition-colors">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-sm text-slate-700 truncate">{item.name}</p>
                                                        <p className="text-[10px] font-mono text-slate-400">{item.code}</p>
                                                    </div>
                                                    <div className="flex gap-4 sm:gap-6 shrink-0 w-[240px] sm:w-[320px] justify-end items-center">
                                                        <div className="w-10 text-center">
                                                            <p className={`font-bold ${item.inQty > 0 ? 'text-green-600' : 'text-slate-300'}`}>
                                                                {item.inQty}
                                                            </p>
                                                        </div>
                                                        <div className="w-10 text-center">
                                                            <p className={`font-bold ${item.outQty > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                                                                {item.outQty}
                                                            </p>
                                                        </div>
                                                        <div className="w-[80px] sm:w-[100px] text-right">
                                                            <p className={`font-bold text-sm ${item.inQty > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                                                                {formatPrice(item.inValue).replace('Rp', '').trim()}
                                                            </p>
                                                        </div>
                                                        <div className="w-[80px] sm:w-[100px] text-right">
                                                            <p className={`font-bold text-sm ${item.outQty > 0 ? 'text-orange-700' : 'text-slate-300'}`}>
                                                                {formatPrice(item.outValue).replace('Rp', '').trim()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </main>
    );
}

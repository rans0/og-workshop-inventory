'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingDown, ChevronDown, ChevronUp, Package, RefreshCw, Calendar as CalendarIcon, X, Trophy } from 'lucide-react';
import Link from 'next/link';


interface Transaction {
    id: string;
    itemId: string;
    itemName: string;
    itemCode: string;
    itemPrice: number;
    itemDeleted: number;
    categoryId: string;
    categoryName: string;
    categoryDeleted: number;
    type: 'IN' | 'OUT';
    quantity: number;
    notes: string; // Added missing field
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
        adjQty: number; // New field for stock adjustments
        inValue: number;
        outValue: number;
    }[];
    totalIn: number;
    totalOut: number;
    totalAdj: number; // New total field for category adjustments
    totalInValue: number;
    totalOutValue: number;
    expanded: boolean;
}

interface TopItem {
    id: string;
    name: string;
    quantity: number;
}

export default function ReportsPage() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
    const [topItems, setTopItems] = useState<TopItem[]>([]);

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

        const filtered = transactions.filter(tx => {
            if (!startDate && !endDate) return true;

            // Parse txDate as UTC
            const txDate = new Date(tx.createdAt.includes('T') ? tx.createdAt : tx.createdAt.replace(' ', 'T') + 'Z');

            // Get YYYY-MM-DD in Jakarta (using en-CA for reliable YYYY-MM-DD)
            const formatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Jakarta',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const jakartaDateStr = formatter.format(txDate);

            if (startDate && endDate) {
                return jakartaDateStr >= startDate && jakartaDateStr <= endDate;
            } else if (startDate) {
                return jakartaDateStr >= startDate;
            } else if (endDate) {
                return jakartaDateStr <= endDate;
            }
            return true;
        });

        // Group by category
        const categoryMap = new Map<string, CategorySummary>();

        filtered.forEach(tx => {
            const categoryId = tx.categoryId || 'default';
            const categoryName = tx.categoryName || 'Tanpa Kategori';

            if (!categoryMap.has(categoryId)) {
                categoryMap.set(categoryId, {
                    categoryId,
                    categoryName: categoryName + (tx.categoryDeleted ? ' (Terhapus)' : ''),
                    items: [],
                    totalIn: 0,
                    totalOut: 0,
                    totalAdj: 0,
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
                    name: (tx.itemName || 'Barang Terhapus') + (tx.itemDeleted ? ' (Terhapus)' : ''),
                    code: (tx.itemCode || '-').replace(/-DEL-\d+$/, ''), // Clean code for display
                    price: tx.itemPrice || 0,
                    inQty: 0,
                    outQty: 0,
                    adjQty: 0,
                    inValue: 0,
                    outValue: 0
                };
                category.items.push(item);
            }

            const isAdjustment = tx.notes?.includes('[ADJUSTMENT]');

            if (isAdjustment) {
                const adjDelta = tx.type === 'IN' ? tx.quantity : -tx.quantity;
                item.adjQty += adjDelta;
                category.totalAdj += adjDelta;

                // ADJUSTMENT now also impacts Modal Value (Capital Correction)
                const adjValue = adjDelta * (tx.itemPrice || 0);
                item.inValue += adjValue;
                category.totalInValue += adjValue;
                // Note: inQty still only counts original 'Belanja' for statistics?
                // Actually user said 'modal saya hanya 10 pcs', suggesting they want the PCS count corrected too.
                item.inQty += adjDelta;
                category.totalIn += adjDelta;
            } else if (tx.type === 'IN') {
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

        // Calculate Top 3 Items Out
        // 1. Determine day count for threshold
        let dayCount = 1;
        if (startDate && endDate) {
            dayCount = Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        } else if (filtered.length > 0) {
            const dates = filtered.map(t => new Date(t.createdAt.includes('T') ? t.createdAt : t.createdAt.replace(' ', 'T') + 'Z').getTime());
            const minDate = Math.min(...dates);
            const maxDate = Math.max(...dates);
            dayCount = Math.max(1, Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1);
        }

        const threshold = 5 * dayCount;

        // 2. Aggregate quantity out
        const outMap = new Map<string, { name: string, qty: number }>();
        filtered.filter(tx => tx.type === 'OUT' && !tx.notes?.includes('[ADJUSTMENT]')).forEach(tx => {
            const current = outMap.get(tx.itemId) || { name: tx.itemName || 'Barang Terhapus', qty: 0 };
            outMap.set(tx.itemId, {
                name: current.name,
                qty: current.qty + tx.quantity
            });
        });

        // 3. Filter by threshold and sort
        const sortedTop = Array.from(outMap.entries())
            .map(([id, data]) => ({ id, name: data.name, quantity: data.qty }))
            .filter(item => item.quantity >= threshold)
            .sort((a, b) => {
                if (b.quantity !== a.quantity) return b.quantity - a.quantity;
                return a.name.localeCompare(b.name);
            })
            .slice(0, 3);

        setTopItems(sortedTop);
    }, [transactions, startDate, endDate]);

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
        if (!startDate && !endDate) return 'Semua Waktu';

        if (startDate === endDate) {
            return new Date(startDate).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }

        const startLabel = startDate ? new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Awal';
        const endLabel = endDate ? new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sekarang';

        return `${startLabel} - ${endLabel}`;
    };

    const grandTotalIn = categorySummaries.reduce((sum, cat) => sum + cat.totalIn, 0);
    const grandTotalOut = categorySummaries.reduce((sum, cat) => sum + cat.totalOut, 0);
    const grandTotalAdj = categorySummaries.reduce((sum, cat) => sum + cat.totalAdj, 0);
    const grandTotalInValue = categorySummaries.reduce((sum, cat) => sum + cat.totalInValue, 0);
    const grandTotalOutValue = categorySummaries.reduce((sum, cat) => sum + cat.totalOutValue, 0);

    return (
        <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
            <header className="flex items-center gap-3 sm:gap-4">
                <Link href="/" className="p-2 sm:p-3 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform">
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-3xl font-bold">Laporan Stok</h1>
                    <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm text-slate-500">{getPeriodLabel()}</p>
                        <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full font-bold uppercase hidden sm:inline-block">
                            Akrual
                        </span>
                    </div>
                </div>
            </header>

            {/* Date Filter Selection */}
            <div className="card !p-4 sm:!p-6 bg-slate-50 border-slate-200">
                <div className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-1 w-full space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mulai Tanggal</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full !p-3 !bg-white !rounded-xl !border-slate-200 !text-sm font-bold focus:!border-blue-500 focus:!ring-4 focus:!ring-blue-100 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex-1 w-full space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sampai Tanggal</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full !p-3 !bg-white !rounded-xl !border-slate-200 !text-sm font-bold focus:!border-blue-500 focus:!ring-4 focus:!ring-blue-100 transition-all"
                            />
                        </div>
                    </div>
                    {(startDate || endDate) && (
                        <button
                            onClick={() => {
                                setStartDate('');
                                setEndDate('');
                            }}
                            className="p-3 bg-white border border-slate-200 text-red-500 rounded-xl hover:bg-red-50 hover:border-red-100 transition-colors shadow-sm shrink-0 flex items-center gap-2 font-bold text-sm"
                        >
                            <X className="w-4 h-4" />
                            <span className="sm:hidden lg:inline">Reset</span>
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <p className="text-center text-slate-400 py-20">Memuat...</p>
            ) : (
                <>
                    {/* Grand Total Cards - Optimized for Large Numbers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-2">
                        {/* Uang Modal */}
                        <div className="card border-blue-100 bg-blue-50/20 !p-4 flex flex-col gap-3 min-w-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest opacity-60">Uang Modal</p>
                                    <p className="text-sm font-bold text-blue-800">Total Belanja & Koreksi</p>
                                </div>
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-blue-700 leading-none break-all" title={formatPrice(grandTotalInValue)}>
                                    {formatPrice(grandTotalInValue)}
                                </p>
                                <p className="text-sm font-bold mt-2 text-blue-800/60">
                                    {grandTotalIn} pcs tersedia
                                </p>
                            </div>
                        </div>

                        {/* Uang Keluar */}
                        <div className="card border-orange-100 bg-orange-50/20 !p-4 flex flex-col gap-3 min-w-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl shrink-0">
                                    <TrendingDown className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest opacity-60">Uang Keluar</p>
                                    <p className="text-sm font-bold text-orange-800">Pemakaian Barang</p>
                                </div>
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-orange-700 leading-none break-all" title={formatPrice(grandTotalOutValue)}>
                                    {formatPrice(grandTotalOutValue)}
                                </p>
                                <p className="text-sm font-bold mt-2 text-orange-800/60">
                                    {grandTotalOut} pcs keluar
                                </p>
                            </div>
                        </div>

                        {/* Koreksi Stok */}
                        <div className="card border-slate-200 bg-slate-50 !p-4 flex flex-col gap-3 min-w-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-slate-200 text-slate-500 rounded-xl shrink-0">
                                    <RefreshCw className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Koreksi Stok</p>
                                    <p className="text-sm font-bold text-slate-500">Audit & Salah Input</p>
                                </div>
                            </div>
                            <div className="min-w-0">
                                <p className={`text-2xl sm:text-3xl lg:text-4xl font-black leading-none break-all ${grandTotalAdj >= 0 ? 'text-slate-700' : 'text-red-600'}`}>
                                    {grandTotalAdj > 0 ? '+' : ''}{grandTotalAdj} <span className="text-lg font-bold opacity-30">pcs</span>
                                </p>
                                <p className="text-sm font-bold mt-2 text-slate-400 italic">
                                    Langsung memotong Modal
                                </p>
                            </div>
                        </div>

                        {/* Top 3 Barang Card */}
                        <div className="card border-yellow-200 bg-yellow-50/20 !p-4 flex flex-col gap-3 min-w-0 sm:col-span-2 lg:col-span-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-yellow-100 text-yellow-600 rounded-xl shrink-0">
                                    <Trophy className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 text-left">
                                    <p className="text-[10px] font-black text-yellow-800 uppercase tracking-widest opacity-60">Barang Terlaris</p>
                                    <p className="text-sm font-bold text-yellow-800">Top 3 Pengeluaran</p>
                                </div>
                            </div>

                            {topItems.length === 0 ? (
                                <p className="text-xs text-slate-400 font-bold italic py-2">Belum ada barang yang mencapai target penjualan.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {topItems.map((item, idx) => (
                                        <div key={item.id} className="bg-white/60 border border-yellow-100 p-3 rounded-xl flex items-center justify-between gap-3">
                                            <div className="min-w-0 flex items-center gap-2">
                                                <span className="text-xl font-black text-yellow-500 italic opacity-50">#{idx + 1}</span>
                                                <p className="font-bold text-slate-700 truncate text-sm">{item.name}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-lg font-black text-yellow-700 leading-none">{item.quantity}</p>
                                                <p className="text-[8px] font-bold text-yellow-600 uppercase">pcs</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
                                        className="w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors bg-white gap-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold uppercase shrink-0">
                                                {cat.categoryName.charAt(0)}
                                            </div>
                                            <div className="text-left min-w-0">
                                                <h3 className="font-bold text-slate-800 leading-tight truncate">{cat.categoryName}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat.items.length} Barang</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 min-w-0">
                                            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 ml-auto min-w-0">
                                                <div className="flex flex-col items-end min-w-0">
                                                    <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest opacity-60">Modal</span>
                                                    <p className="font-extrabold text-sm sm:text-lg text-blue-700 break-all leading-none mt-0.5">
                                                        {formatPrice(cat.totalInValue).replace('Rp', '').trim()}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end min-w-0">
                                                    <span className="text-[9px] text-orange-500 font-black uppercase tracking-widest opacity-60">Keluar</span>
                                                    <p className="font-extrabold text-sm sm:text-lg text-orange-700 break-all leading-none mt-0.5">
                                                        {formatPrice(cat.totalOutValue).replace('Rp', '').trim()}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end min-w-0">
                                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest opacity-60">Koreksi</span>
                                                    <p className={`font-extrabold text-sm sm:text-lg break-all leading-none mt-0.5 ${cat.totalAdj >= 0 ? 'text-slate-500' : 'text-red-500'}`}>
                                                        {cat.totalAdj > 0 ? '+' : ''}{cat.totalAdj}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`p-1 rounded-full transition-transform ${cat.expanded ? 'bg-slate-100 rotate-180 sm:rotate-0' : ''}`}>
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
                                            {/* List Header (Desktop Only) */}
                                            <div className="px-4 py-2 border-b border-slate-100 hidden sm:flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100/30">
                                                <span className="flex-1">Barang</span>
                                                <div className="flex gap-8 shrink-0 justify-end items-center">
                                                    <span className="w-16 sm:w-20 text-right">Modal</span>
                                                    <span className="w-16 sm:w-20 text-right">Keluar</span>
                                                </div>
                                            </div>

                                            <div className="space-y-px">
                                                {cat.items.map((item) => (
                                                    <div key={item.id} className="px-4 py-4 sm:py-5 border-b border-slate-100 flex flex-col gap-4 hover:bg-white/80 transition-colors last:border-b-0">
                                                        {/* Header: Name & Pills */}
                                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-slate-800 text-base sm:text-lg leading-tight truncate">{item.name}</p>
                                                                <p className="text-[10px] sm:text-xs font-medium text-slate-400 font-mono mt-1 uppercase tracking-wider">{item.code}</p>
                                                            </div>
                                                            {/* Quantity Pills */}
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="text-[10px] sm:text-xs px-2 py-1 bg-green-50 text-green-700 rounded-lg font-bold border border-green-100/50">
                                                                    {item.inQty > 0 ? `+${item.inQty}` : item.inQty} In
                                                                </span>
                                                                <span className="text-[10px] sm:text-xs px-2 py-1 bg-red-50 text-red-700 rounded-lg font-bold border border-red-100/50">
                                                                    {item.outQty} Out
                                                                </span>
                                                                {item.adjQty !== 0 && (
                                                                    <span className={`text-[10px] sm:text-xs px-2 py-1 rounded-lg font-bold border ${item.adjQty > 0 ? 'bg-blue-50 text-blue-700 border-blue-100/50' : 'bg-orange-50 text-orange-700 border-orange-100/50'}`}>
                                                                        {item.adjQty > 0 ? '+' : ''}{item.adjQty} Adj
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Financial Highlight (Mini-Dashboard) */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="bg-blue-50/50 border border-blue-100/50 p-2.5 sm:p-3 rounded-2xl flex flex-col">
                                                                <span className="text-[9px] sm:text-xs text-blue-500 font-black uppercase tracking-widest mb-1 opacity-70">Modal Net</span>
                                                                <p className={`font-black text-sm sm:text-xl break-all leading-none ${item.inQty !== 0 ? 'text-blue-700' : 'text-slate-400'}`} title={formatPrice(item.inValue)}>
                                                                    {formatPrice(item.inValue)}
                                                                </p>
                                                            </div>
                                                            <div className="bg-orange-50/50 border border-orange-100/50 p-2.5 sm:p-3 rounded-2xl flex flex-col">
                                                                <span className="text-[9px] sm:text-xs text-orange-500 font-black uppercase tracking-widest mb-1 opacity-70">Uang Keluar</span>
                                                                <p className={`font-black text-sm sm:text-xl break-all leading-none ${item.outQty !== 0 ? 'text-orange-800' : 'text-slate-400'}`} title={formatPrice(item.outValue)}>
                                                                    {formatPrice(item.outValue)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
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

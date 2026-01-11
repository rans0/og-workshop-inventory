'use client';

import React, { useState, useEffect, use } from 'react';
import { ArrowLeft, CheckCircle2, ChevronDown, Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Category {
    id: string;
    name: string;
}

interface Item {
    id: string;
    code: string;
    name: string;
    categoryId: string;
    categoryName: string;
    currentStock: number;
}

export default function TransactionPage({ params }: { params: Promise<{ type: string }> }) {
    const { type } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedItemId = searchParams.get('item');

    const [categories, setCategories] = useState<Category[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [filteredItems, setFilteredItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedItemId, setSelectedItemId] = useState(preselectedItemId || '');
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const selectedItem = items.find(i => i.id === selectedItemId);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, itemRes] = await Promise.all([
                    fetch('/api/categories'),
                    fetch('/api/items')
                ]);

                if (catRes.ok && itemRes.ok) {
                    const cats = await catRes.json();
                    const itms = await itemRes.json();
                    setCategories(cats);
                    setItems(itms);
                    setFilteredItems(itms);

                    // If preselected item, set category filter
                    if (preselectedItemId) {
                        const item = itms.find((i: Item) => i.id === preselectedItemId);
                        if (item) {
                            setSelectedCategoryId(item.categoryId);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [preselectedItemId]);

    // Filter items by category
    useEffect(() => {
        if (selectedCategoryId) {
            setFilteredItems(items.filter(i => i.categoryId === selectedCategoryId));
        } else {
            setFilteredItems(items);
        }
    }, [selectedCategoryId, items]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemId || quantity <= 0 || submitting) return;

        const item = items.find(i => i.id === selectedItemId);
        if (!item) return;

        // Validation for OUT
        if (type === 'out' && item.currentStock < quantity) {
            alert(`Stok tidak cukup! Sisa stok: ${item.currentStock}`);
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId: selectedItemId,
                    type: type.toUpperCase(),
                    quantity,
                    notes
                })
            });

            if (res.ok) {
                setIsSuccess(true);
                setTimeout(() => {
                    router.push('/');
                }, 1500);
            } else {
                alert('Gagal mencatat transaksi!');
            }
        } catch {
            alert('Error mencatat transaksi!');
        } finally {
            setSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
                <CheckCircle2 className="w-24 h-24 sm:w-32 sm:h-32 text-green-500 animate-bounce" />
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900">BERHASIL!</h1>
                <p className="text-lg sm:text-xl text-slate-500">Mencatat barang {type === 'in' ? 'masuk' : 'keluar'}</p>
            </div>
        );
    }

    return (
        <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
            <header className="flex items-center gap-3 sm:gap-4">
                <Link href="/" className="p-2 sm:p-3 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform">
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
                <h1 className="text-xl sm:text-3xl font-bold">
                    Barang {type === 'in' ? 'Masuk' : 'Keluar'}
                </h1>
            </header>

            {loading ? (
                <p className="text-center text-slate-400 py-20">Memuat...</p>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    {/* Category Filter */}
                    <div className="card !p-4 sm:!p-6">
                        <label className="!text-lg sm:!text-xl font-black text-slate-500 uppercase tracking-wide mb-2 block">1. Filter Kategori</label>
                        <div className="relative">
                            <select
                                value={selectedCategoryId}
                                onChange={(e) => {
                                    setSelectedCategoryId(e.target.value);
                                    setSelectedItemId(''); // Reset item selection
                                }}
                                className="appearance-none pr-12 !p-4 sm:!p-5 !text-lg sm:!text-2xl font-bold bg-slate-50 border-2 border-slate-100 rounded-2xl"
                            >
                                <option value="">-- Semua Kategori --</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                    </div>

                    {/* Item Selection */}
                    <div className="card !p-4 sm:!p-6">
                        <label className="!text-lg sm:!text-xl font-black text-slate-500 uppercase tracking-wide mb-2 block">2. Pilih Barang</label>
                        <div className="relative">
                            <select
                                value={selectedItemId}
                                onChange={(e) => setSelectedItemId(e.target.value)}
                                className="appearance-none pr-12 !p-4 sm:!p-5 !text-lg sm:!text-2xl font-bold bg-slate-50 border-2 border-slate-100 rounded-2xl"
                            >
                                <option value="">-- Pilih dari Daftar --</option>
                                {filteredItems.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        {selectedItem && (
                            <div className="mt-4 p-4 sm:p-6 bg-blue-50 border-2 border-blue-100 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <Package className="w-8 h-8 sm:w-12 sm:h-12 text-blue-500" />
                                    <div>
                                        <p className="font-black text-lg sm:text-2xl text-blue-900">{selectedItem.name}</p>
                                        <p className="text-xs sm:text-lg font-bold text-blue-600">Kode: {selectedItem.code}</p>
                                    </div>
                                </div>
                                <div className="text-right border-l-2 border-blue-200 pl-4 sm:pl-6">
                                    <p className="text-[10px] sm:text-sm font-black text-blue-400 uppercase">Stok Saat Ini</p>
                                    <p className={`text-2xl sm:text-5xl font-black leading-none ${selectedItem.currentStock < 5 ? 'text-red-600' : 'text-blue-700'}`}>
                                        {selectedItem.currentStock}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quantity */}
                    <div className="card text-center !p-4 sm:!p-6">
                        <label className="text-center !text-lg sm:!text-xl font-black text-slate-500 uppercase tracking-wide block">3. Jumlah Barang</label>
                        <div className="flex items-center justify-center gap-6 sm:gap-10 py-6">
                            <button
                                type="button"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-100 rounded-full border-4 border-slate-200 text-3xl sm:text-5xl font-black flex items-center justify-center active:bg-slate-200 transition-colors shadow-sm"
                            >
                                -
                            </button>
                            <span className="text-5xl sm:text-8xl font-black min-w-[100px] sm:min-w-[150px] text-slate-900">{quantity}</span>
                            <button
                                type="button"
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-100 rounded-full border-4 border-slate-200 text-3xl sm:text-5xl font-black flex items-center justify-center active:bg-slate-200 transition-colors shadow-sm"
                            >
                                +
                            </button>
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-base sm:text-lg">pcs</p>
                    </div>

                    {/* Notes */}
                    <div className="card !p-4 sm:!p-6">
                        <label className="!text-base sm:!text-lg">Catatan (Opsional)</label>
                        <input
                            placeholder="Misal: Dari PT Maju Jaya"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="!p-3 sm:!p-5 !text-base sm:!text-xl"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={!selectedItemId || submitting}
                        className={`w-full p-5 sm:p-8 rounded-2xl sm:rounded-3xl text-xl sm:text-3xl font-black shadow-xl transition-all active:scale-95 ${type === 'in'
                            ? 'bg-green-600 text-white shadow-green-200'
                            : 'bg-red-600 text-white shadow-red-200'
                            } disabled:opacity-30 disabled:grayscale`}
                    >
                        {submitting ? 'MENYIMPAN...' : type === 'in' ? 'SIMPAN BARANG MASUK' : 'SIMPAN BARANG KELUAR'}
                    </button>
                </form>
            )}
        </main>
    );
}

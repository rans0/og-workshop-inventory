'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Package, Layers, Info } from 'lucide-react';
import Link from 'next/link';

interface DeletedItem {
    id: string;
    name: string;
    code: string;
    categoryName: string;
    isDeleted: number;
}

interface DeletedCategory {
    id: string;
    name: string;
    isDeleted: number;
}

export default function DeletedDataManager() {
    const [items, setItems] = useState<DeletedItem[]>([]);
    const [categories, setCategories] = useState<DeletedCategory[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [itemsRes, catsRes] = await Promise.all([
                fetch('/api/items?includeDeleted=true'),
                fetch('/api/categories?includeDeleted=true')
            ]);
            if (itemsRes.ok && catsRes.ok) {
                const itemsData = await itemsRes.json();
                const catsData = await catsRes.json();
                setItems(itemsData.filter((i: DeletedItem) => i.isDeleted === 1));
                setCategories(catsData.filter((c: DeletedCategory) => c.isDeleted === 1));
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const restoreItem = async (id: string) => {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/items/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restore: true })
            });
            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal restore barang');
            }
        } catch {
            alert('Error restore barang');
        } finally {
            setActionLoading(null);
        }
    };

    const restoreCategory = async (id: string) => {
        setActionLoading(id);
        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restore: true })
            });
            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal restore kategori');
            }
        } catch {
            alert('Error restore kategori');
        } finally {
            setActionLoading(null);
        }
    };

    const cleanName = (name: string) => name.replace(/-DEL-\d+$/, '');
    const cleanCode = (code: string) => code.replace(/-DEL-\d+$/, '');

    return (
        <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
            <header className="flex items-center gap-4">
                <Link href="/settings" className="p-2 sm:p-3 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform">
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                </Link>
                <h1 className="text-xl sm:text-3xl font-bold text-slate-800">Data Terhapus</h1>
            </header>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 text-amber-800 text-sm">
                <Info className="w-5 h-5 shrink-0" />
                <p>Silakan pilih barang atau kategori untuk dikembalikan (Restore) ke daftar aktif. Nama akan otomatis kembali ke aslinya.</p>
            </div>

            <section className="space-y-4">
                <h2 className="font-bold text-slate-500 uppercase text-xs tracking-widest px-1">Kategori Terhapus ({categories.length})</h2>
                {categories.length === 0 ? (
                    <p className="text-slate-400 text-center py-4 italic text-sm">Tidak ada kategori terhapus.</p>
                ) : (
                    <div className="space-y-2">
                        {categories.map(cat => (
                            <div key={cat.id} className="card flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                        <Layers className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-slate-700">{cleanName(cat.name)}</span>
                                </div>
                                <button
                                    onClick={() => restoreCategory(cat.id)}
                                    disabled={actionLoading === cat.id}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-4 h-4 ${actionLoading === cat.id ? 'animate-spin' : ''}`} />
                                    Restore
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="space-y-4">
                <h2 className="font-bold text-slate-500 uppercase text-xs tracking-widest px-1">Barang Terhapus ({items.length})</h2>
                {items.length === 0 ? (
                    <p className="text-slate-400 text-center py-4 italic text-sm">Tidak ada barang terhapus.</p>
                ) : (
                    <div className="space-y-2">
                        {items.map(item => (
                            <div key={item.id} className="card flex items-center justify-between p-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-700 truncate">{cleanName(item.name)}</p>
                                        <p className="text-xs text-slate-400 font-bold">{cleanCode(item.code)} • {item.categoryName}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => restoreItem(item.id)}
                                    disabled={actionLoading === item.id}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-4 h-4 ${actionLoading === item.id ? 'animate-spin' : ''}`} />
                                    Restore
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

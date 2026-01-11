'use client';

import React, { useState, useEffect, use } from 'react';
import { ArrowLeft, Plus, Package, Trash2, Pencil } from 'lucide-react';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Item {
    id: string;
    code: string;
    name: string;
    currentStock: number;
    unit: string;
    price: number;
}

interface CategoryDetail {
    id: string;
    name: string;
    items: Item[];
    totalStock: number;
}

export default function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [category, setCategory] = useState<CategoryDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddItem, setShowAddItem] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemStock, setNewItemStock] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);

    const fetchCategory = React.useCallback(async () => {
        try {
            const res = await fetch(`/api/categories/${id}`);
            if (res.ok) {
                const data = await res.json();
                setCategory(data);
            }
        } catch (err) {
            console.error('Failed to fetch category:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchCategory();
    }, [fetchCategory]);

    const addItem = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newItemName.trim();
        if (!trimmed) return;
        if (trimmed.length < 3) {
            alert('Nama barang minimal 3 karakter');
            return;
        }

        try {
            const res = await fetch('/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: trimmed,
                    categoryId: id,
                    price: parseInt(newItemPrice) || 0
                })
            });

            if (res.ok) {
                const newItem = await res.json();

                // Record initial stock if > 0
                const initialStock = parseInt(newItemStock);
                if (initialStock > 0) {
                    await fetch('/api/transactions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            itemId: newItem.id,
                            type: 'IN',
                            quantity: initialStock,
                            notes: 'Stok awal'
                        })
                    });
                }

                setNewItemName('');
                setNewItemPrice('');
                setNewItemStock('');
                setShowAddItem(false);
                fetchCategory();
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal menambah barang');
            }
        } catch {
            alert('Gagal menambah barang');
        }
    };

    const deleteItem = async () => {
        if (!deleteTarget) return;

        try {
            const res = await fetch(`/api/items/${deleteTarget.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setDeleteTarget(null);
                fetchCategory();
            }
        } catch {
            alert('Gagal menghapus barang');
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    if (loading) {
        return (
            <main className="max-w-2xl mx-auto p-4 sm:p-6">
                <p className="text-center text-slate-400 py-20">Memuat...</p>
            </main>
        );
    }

    if (!category) {
        return (
            <main className="max-w-2xl mx-auto p-4 sm:p-6">
                <p className="text-center text-slate-400 py-20">Kategori tidak ditemukan</p>
            </main>
        );
    }

    return (
        <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
            <header className="flex items-center gap-3 sm:gap-4">
                <Link href="/categories" className="p-2 sm:p-3 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform">
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-3xl font-bold">{category.name}</h1>
                    <p className="text-sm text-slate-500">{category.items.length} barang • Total: {category.totalStock} pcs</p>
                </div>
            </header>

            {/* Quick Add Button */}
            {!showAddItem ? (
                <button
                    onClick={() => setShowAddItem(true)}
                    className="w-full p-4 bg-blue-50 border-2 border-blue-200 border-dashed rounded-2xl text-blue-600 font-bold flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Tambah Barang Baru
                </button>
            ) : (
                <form onSubmit={addItem} className="card space-y-4 !p-4">
                    <div>
                        <label className="!text-sm">Nama Barang</label>
                        <input
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="Misal: Oli MPX2 0.8L"
                            className="!p-3"
                            autoFocus
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="!text-sm">Harga (Rp)</label>
                            <input
                                type="number"
                                value={newItemPrice}
                                onChange={(e) => setNewItemPrice(e.target.value)}
                                placeholder="50000"
                                className="!p-3"
                            />
                        </div>
                        <div>
                            <label className="!text-sm">Stok Awal</label>
                            <input
                                type="number"
                                value={newItemStock}
                                onChange={(e) => setNewItemStock(e.target.value)}
                                placeholder="0"
                                className="!p-3"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setShowAddItem(false)}
                            className="flex-1 p-3 bg-slate-100 rounded-xl font-bold"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 p-3 bg-blue-600 text-white rounded-xl font-bold"
                        >
                            Simpan
                        </button>
                    </div>
                </form>
            )}

            {/* Items List */}
            <div className="space-y-3">
                {category.items.length === 0 ? (
                    <p className="text-center text-slate-400 py-10 italic">Belum ada barang di kategori ini.</p>
                ) : (
                    category.items.map((item) => (
                        <div key={item.id} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-blue-500" />
                                    <h3 className="font-bold text-slate-700 truncate">{item.name}</h3>
                                </div>
                                <div className="text-sm text-slate-500 mt-1">
                                    <span className="font-mono">{item.code}</span>
                                    {item.price > 0 && <span className="ml-2">• {formatPrice(item.price)}</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right mr-2">
                                    <p className="text-2xl font-black text-slate-800">{item.currentStock}</p>
                                    <p className="text-xs text-slate-400">{item.unit}</p>
                                </div>
                                <Link
                                    href={`/items?edit=${item.id}`}
                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl"
                                >
                                    <Pencil className="w-5 h-5" />
                                </Link>
                                <button
                                    onClick={() => setDeleteTarget(item)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Hapus Barang?"
                message={`Barang "${deleteTarget?.name}" akan dihapus. Histori transaksi tetap disimpan.`}
                confirmText="Hapus"
                onConfirm={deleteItem}
                onCancel={() => setDeleteTarget(null)}
            />
        </main>
    );
}

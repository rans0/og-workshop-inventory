'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ArrowLeft, Plus, Package } from 'lucide-react';
import Link from 'next/link';

export default function ItemsPage() {
    const items = useLiveQuery(() => db.items.toArray());
    const categories = useLiveQuery(() => db.categories.toArray());

    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        initialStock: '0'
    });

    const generateCode = async () => {
        const allItems = await db.items.toArray();
        const count = allItems.length + 1;
        return `WS-${count.toString().padStart(4, '0')}`;
    };

    const addItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.categoryId) {
            alert('Mohon isi nama dan pilih kategori!');
            return;
        }

        try {
            const code = await generateCode();
            const id = crypto.randomUUID();

            await db.items.add({
                id,
                code,
                name: formData.name.trim(),
                categoryId: formData.categoryId,
                currentStock: parseInt(formData.initialStock) || 0,
                unit: 'pcs',
                lastUpdatedAt: new Date()
            });

            // Also record initial transaction if stock > 0
            if (parseInt(formData.initialStock) > 0) {
                await db.transactions.add({
                    id: crypto.randomUUID(),
                    itemId: id,
                    type: 'IN',
                    quantity: parseInt(formData.initialStock),
                    notes: 'Stok awal',
                    createdAt: new Date(),
                    syncStatus: 'PENDING'
                });
            }

            setFormData({ name: '', categoryId: '', initialStock: '0' });
            setIsAdding(false);
        } catch {
            alert('Nama barang sudah ada!');
        }
    };

    return (
        <main className="max-w-4xl mx-auto p-6 space-y-8">
            <header className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-3xl font-bold">Daftar Barang</h1>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="btn-success p-4 flex items-center gap-2 rounded-2xl font-bold"
                >
                    <Plus className="w-6 h-6" />
                    Tambah Barang
                </button>
            </header>

            {isAdding && (
                <form onSubmit={addItem} className="card space-y-6 border-blue-200 bg-blue-50/50">
                    <h2 className="text-xl font-bold text-blue-800">Barang Baru</h2>
                    <div className="space-y-4">
                        <div>
                            <label>Nama Barang</label>
                            <input
                                placeholder="Misal: Baut M6 10mm"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label>Kategori</label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            >
                                <option value="">Pilih Kategori...</option>
                                {categories?.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label>Stok Awal</label>
                            <input
                                type="number"
                                value={formData.initialStock}
                                onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="flex-1 p-5 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-500"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="flex-1 p-5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg"
                            >
                                Simpan Barang
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Item List */}
            <div className="space-y-4">
                {items?.map((item) => {
                    const cat = categories?.find(c => c.id === item.categoryId);
                    return (
                        <div key={item.id} className="card flex items-center gap-6">
                            <div className="p-4 bg-slate-100 rounded-2xl">
                                <Package className="w-10 h-10 text-slate-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold bg-slate-200 px-2 py-0.5 rounded uppercase text-slate-600">
                                        {item.code}
                                    </span>
                                    <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                                        {cat?.name || 'No Category'}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800">{item.name}</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-400">STOK SAAT INI</p>
                                <p className={`text-4xl font-black ${item.currentStock < 5 ? 'text-red-600' : 'text-slate-800'}`}>
                                    {item.currentStock}
                                </p>
                                <p className="text-xs font-bold text-slate-400">pcs</p>
                            </div>
                        </div>
                    );
                })}
                {items?.length === 0 && !isAdding && (
                    <div className="card text-center py-20 opacity-50">
                        <Package className="w-20 h-20 mx-auto mb-4 text-slate-200" />
                        <p className="text-xl font-bold text-slate-400 italic">Belum ada barang terdaftar.</p>
                    </div>
                )}
            </div>
        </main>
    );
}

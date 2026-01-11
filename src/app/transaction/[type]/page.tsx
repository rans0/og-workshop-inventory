'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ArrowLeft, CheckCircle2, ChevronDown, Package } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export const runtime = 'edge';

export default function TransactionPage() {
    const params = useParams();
    const router = useRouter();
    const type = params.type as 'in' | 'out';

    const items = useLiveQuery(() => db.items.toArray());
    const [selectedItemId, setSelectedItemId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const selectedItem = items?.find(i => i.id === selectedItemId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemId || quantity <= 0) return;

        const item = await db.items.get(selectedItemId);
        if (!item) return;

        // Validation for OUT
        if (type === 'out' && item.currentStock < quantity) {
            alert(`Stok tidak cukup! Sisa stok: ${item.currentStock}`);
            return;
        }

        try {
            await db.transaction('rw', [db.transactions, db.items], async () => {
                // 1. Record transaction
                await db.transactions.add({
                    id: crypto.randomUUID(),
                    itemId: selectedItemId,
                    type: type.toUpperCase() as 'IN' | 'OUT',
                    quantity,
                    notes,
                    createdAt: new Date(),
                    syncStatus: 'PENDING'
                });

                // 2. Update item stock
                const newStock = type === 'in'
                    ? item.currentStock + quantity
                    : item.currentStock - quantity;

                await db.items.update(selectedItemId, {
                    currentStock: newStock,
                    lastUpdatedAt: new Date()
                });
            });

            setIsSuccess(true);
            setTimeout(() => {
                router.push('/');
            }, 1500);
        } catch {
            alert('Gagal mencatat transaksi!');
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
                <CheckCircle2 className="w-32 h-32 text-green-500 animate-bounce" />
                <h1 className="text-4xl font-black text-slate-900">BERHASIL!</h1>
                <p className="text-xl text-slate-500">Mencatat barang {type === 'in' ? 'masuk' : 'keluar'}</p>
            </div>
        );
    }

    return (
        <main className="max-w-2xl mx-auto p-6 space-y-8">
            <header className="flex items-center gap-4">
                <Link href="/" className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-3xl font-bold">
                    Barang {type === 'in' ? 'Masuk' : 'Keluar'}
                </h1>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Item Selection */}
                <div className="card">
                    <label>Pilih Barang</label>
                    <div className="relative">
                        <select
                            value={selectedItemId}
                            onChange={(e) => setSelectedItemId(e.target.value)}
                            className="appearance-none pr-12"
                        >
                            <option value="">-- Pilih dari Daftar --</option>
                            {items?.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name} (Stok: {item.currentStock})
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-8 h-8" />
                    </div>
                    {selectedItem && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-2xl flex items-center gap-4">
                            <Package className="w-10 h-10 text-blue-500" />
                            <div>
                                <p className="font-bold text-blue-800">{selectedItem.name}</p>
                                <p className="text-sm text-blue-600">Kode: {selectedItem.code}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quantity */}
                <div className="card text-center">
                    <label className="text-center">Jumlah Barang</label>
                    <div className="flex items-center justify-center gap-6 py-4">
                        <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-20 h-20 bg-slate-100 rounded-full border-4 border-slate-200 text-4xl font-bold flex items-center justify-center active:bg-slate-200"
                        >
                            -
                        </button>
                        <span className="text-6xl font-black min-w-[120px]">{quantity}</span>
                        <button
                            type="button"
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-20 h-20 bg-slate-100 rounded-full border-4 border-slate-200 text-4xl font-bold flex items-center justify-center active:bg-slate-200"
                        >
                            +
                        </button>
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-wider">pcs</p>
                </div>

                {/* Notes */}
                <div className="card">
                    <label>Catatan (Opsional)</label>
                    <input
                        placeholder="Misal: Dari PT Maju Jaya"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={!selectedItemId}
                    className={`w-full p-8 rounded-3xl text-3xl font-black shadow-xl transition-all active:scale-95 ${type === 'in'
                        ? 'bg-green-600 text-white shadow-green-200'
                        : 'bg-red-600 text-white shadow-red-200'
                        } disabled:opacity-30 disabled:grayscale`}
                >
                    {type === 'in' ? 'SIMPAN BARANG MASUK' : 'SIMPAN BARANG KELUAR'}
                </button>
            </form>
        </main>
    );
}

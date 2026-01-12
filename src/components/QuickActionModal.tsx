'use client';

import React, { useState } from 'react';
import { PlusCircle, MinusCircle, X } from 'lucide-react';
import Link from 'next/link';

export interface Item {
    id: string;
    code: string;
    name: string;
    currentStock: number;
}

interface QuickActionModalProps {
    item: Item;
    onRefresh: () => void;
    onClose: () => void;
}

export default function QuickActionModal({
    item,
    onRefresh,
    onClose
}: QuickActionModalProps) {
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [newStock, setNewStock] = useState(item.currentStock.toString());
    const [submitting, setSubmitting] = useState(false);

    const handleAdjust = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/items/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adjustment: parseInt(newStock) })
            });
            if (res.ok) {
                onRefresh();
                onClose();
            } else {
                alert('Gagal memperbarui stok');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 space-y-4 animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{item.name}</h3>
                        <p className="text-sm text-slate-500">{item.code} • Stok: {item.currentStock}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {isAdjusting ? (
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-3 border border-slate-200">
                        <label className="block text-sm font-bold text-slate-600">Koreksi Stok Menjadi:</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={newStock}
                                onChange={(e) => setNewStock(e.target.value)}
                                className="flex-1 p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg"
                                autoFocus
                            />
                            <button
                                onClick={handleAdjust}
                                disabled={submitting}
                                className="bg-blue-600 text-white px-6 rounded-xl font-bold active:scale-95 transition-all disabled:opacity-50"
                            >
                                Simpan
                            </button>
                        </div>
                        <button
                            onClick={() => setIsAdjusting(false)}
                            className="w-full text-center text-slate-400 text-sm font-bold"
                        >
                            Batal
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            href={`/transaction/in?item=${item.id}`}
                            className="flex flex-col items-center gap-2 p-5 bg-green-50 border-2 border-green-200 rounded-2xl text-green-700 font-bold active:scale-95 transition-all"
                        >
                            <PlusCircle className="w-10 h-10" />
                            <span>Barang Masuk</span>
                        </Link>
                        <Link
                            href={`/transaction/out?item=${item.id}`}
                            className="flex flex-col items-center gap-2 p-5 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 font-bold active:scale-95 transition-all"
                        >
                            <MinusCircle className="w-10 h-10" />
                            <span>Barang Keluar</span>
                        </Link>
                    </div>
                )}

                {!isAdjusting && (
                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={() => setIsAdjusting(true)}
                            className="w-full text-center p-4 bg-orange-50 rounded-2xl text-orange-600 font-bold border-2 border-orange-100 active:scale-95 transition-all"
                        >
                            Koreksi Stok (Edit Langsung)
                        </button>
                        <Link
                            href={`/items/${item.id}`}
                            className="block w-full text-center p-4 bg-slate-100 rounded-2xl text-slate-600 font-bold active:scale-95 transition-all"
                        >
                            Lihat Detail Barang
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function CategoriesPage() {
    const categories = useLiveQuery(() => db.categories.toArray());
    const [newName, setNewName] = useState('');

    const addCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        try {
            await db.categories.add({
                id: crypto.randomUUID(),
                name: newName.trim(),
                createdAt: new Date()
            });
            setNewName('');
        } catch (err) {
            alert('Nama kategori sudah ada!');
        }
    };

    const deleteCategory = async (id: string) => {
        if (confirm('Hapus kategori ini?')) {
            await db.categories.delete(id);
        }
    };

    return (
        <main className="max-w-2xl mx-auto p-6 space-y-8">
            <header className="flex items-center gap-4">
                <Link href="/" className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-3xl font-bold">Kategori Barang</h1>
            </header>

            <form onSubmit={addCategory} className="card space-y-4">
                <div>
                    <label>Tambah Kategori Baru</label>
                    <div className="flex gap-2">
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Misal: Baut, Oli, Ban..."
                            className="flex-1"
                        />
                        <button type="submit" className="p-5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 active:scale-95 transition-all">
                            <Plus className="w-8 h-8" />
                        </button>
                    </div>
                </div>
            </form>

            <div className="space-y-3">
                {categories?.map((cat) => (
                    <div key={cat.id} className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
                        <span className="text-xl font-bold text-slate-700">{cat.name}</span>
                        <button
                            onClick={() => deleteCategory(cat.id)}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl"
                        >
                            <Trash2 className="w-6 h-6" />
                        </button>
                    </div>
                ))}
                {categories?.length === 0 && (
                    <p className="text-center text-slate-400 py-10 italic">Belum ada kategori.</p>
                )}
            </div>
        </main>
    );
}

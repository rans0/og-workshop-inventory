'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Pencil, Package, ChevronRight, Layers } from 'lucide-react';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Category {
    id: string;
    name: string;
    itemCount: number;
    totalStock: number;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const addCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newName.trim();
        if (!trimmed) return;
        if (trimmed.length < 2) {
            alert('Nama kategori minimal 2 karakter');
            return;
        }

        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: trimmed })
            });

            if (res.ok) {
                setNewName('');
                fetchCategories();
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal menambah kategori');
            }
        } catch {
            alert('Error menambah kategori');
        }
    };

    const updateCategory = async (id: string) => {
        const trimmed = editName.trim();
        if (!trimmed) return;
        if (trimmed.length < 2) {
            alert('Nama kategori minimal 2 karakter');
            return;
        }

        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: trimmed })
            });

            if (res.ok) {
                setEditingId(null);
                fetchCategories();
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal update kategori');
            }
        } catch {
            alert('Gagal update kategori');
        }
    };

    const deleteCategory = async () => {
        if (!deleteTarget) return;

        try {
            const res = await fetch(`/api/categories/${deleteTarget.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setDeleteTarget(null);
                fetchCategories();
            }
        } catch {
            alert('Gagal menghapus kategori');
        }
    };

    const startEdit = (cat: Category) => {
        setEditingId(cat.id);
        setEditName(cat.name);
    };

    return (
        <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
            <header className="flex items-center gap-3 sm:gap-4">
                <Link href="/" className="p-2 sm:p-3 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform">
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
                <h1 className="text-xl sm:text-3xl font-bold">Kategori Barang</h1>
            </header>

            <form onSubmit={addCategory} className="card space-y-4 !p-4 sm:!p-6">
                <div>
                    <label className="!text-base sm:!text-lg">Tambah Kategori Baru</label>
                    <div className="flex gap-2">
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Misal: Baut, Oli, Ban..."
                            className="flex-1 !p-3 sm:!p-5 !text-base sm:!text-xl"
                        />
                        <button type="submit" className="p-3 sm:p-5 bg-blue-600 text-white rounded-xl sm:rounded-2xl hover:bg-blue-700 active:scale-95 transition-all">
                            <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
                        </button>
                    </div>
                </div>
            </form>

            <div className="space-y-3">
                {loading ? (
                    <p className="text-center text-slate-400 py-10">Memuat...</p>
                ) : categories.length === 0 ? (
                    <p className="text-center text-slate-400 py-10 italic">Belum ada kategori.</p>
                ) : (
                    categories.map((cat) => (
                        <div key={cat.id} className="p-4 sm:p-5 bg-white rounded-2xl shadow-sm border border-slate-200">
                            {editingId === cat.id ? (
                                <div className="flex gap-2">
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="flex-1 !p-3"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => updateCategory(cat.id)}
                                        className="px-4 bg-green-600 text-white rounded-xl font-bold"
                                    >
                                        Simpan
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="px-4 bg-slate-200 rounded-xl font-bold"
                                    >
                                        Batal
                                    </button>
                                </div>
                            ) : (
                                <Link href={`/categories/${cat.id}`} className="flex items-center gap-4">
                                    <div className="p-3 bg-orange-50 rounded-xl shrink-0">
                                        <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg sm:text-xl font-bold text-slate-700 truncate">{cat.name}</h3>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-sm text-slate-500 mt-1 font-medium">
                                            <div className="flex items-center gap-1">
                                                <Package className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                                                <span>{cat.itemCount} barang</span>
                                            </div>
                                            <span className="hidden sm:inline text-slate-300">•</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-slate-400 uppercase text-[8px] sm:text-[10px] font-bold">Total Stok:</span>
                                                <span className="font-bold text-slate-700">{cat.totalStock} pcs</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={(e) => { e.preventDefault(); startEdit(cat); }}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl"
                                        >
                                            <Pencil className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.preventDefault(); setDeleteTarget(cat); }}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                        <ChevronRight className="w-5 h-5 text-slate-300" />
                                    </div>
                                </Link>
                            )}
                        </div>
                    ))
                )}
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Hapus Kategori?"
                message={`Semua barang dalam kategori "${deleteTarget?.name}" akan ikut terhapus. Histori transaksi tetap disimpan.`}
                confirmText="Hapus"
                onConfirm={deleteCategory}
                onCancel={() => setDeleteTarget(null)}
            />
        </main>
    );
}

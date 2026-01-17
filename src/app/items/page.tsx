'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Package, Pencil, X, Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

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
    unit: string;
    price: number;
}

export default function ItemsPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        price: '',
        initialStock: '0'
    });

    const fetchData = async () => {
        try {
            const [itemsRes, catsRes] = await Promise.all([
                fetch('/api/items'),
                fetch('/api/categories')
            ]);

            if (itemsRes.ok && catsRes.ok) {
                setItems(await itemsRes.json());
                setCategories(await catsRes.json());
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (editId && items.length > 0) {
            const itemToEdit = items.find(i => i.id === editId);
            if (itemToEdit) {
                startEdit(itemToEdit);
            }
        }
    }, [editId, items]);

    const formatPrice = (price: number) => {
        if (price === 0) return '';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    const addItem = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = formData.name.trim();
        if (!trimmed || !formData.categoryId) {
            alert('Mohon isi nama dan pilih kategori!');
            return;
        }
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
                    categoryId: formData.categoryId,
                    price: parseInt(formData.price) || 0
                })
            });

            if (res.ok) {
                const newItem = await res.json();

                // Record initial stock if > 0
                const initialStock = parseInt(formData.initialStock);
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

                setFormData({ name: '', categoryId: '', price: '', initialStock: '0' });
                setIsAdding(false);
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal menambah barang!');
            }
        } catch {
            alert('Gagal menambah barang!');
        }
    };

    const updateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = formData.name.trim();
        if (!editingItem || !trimmed || !formData.categoryId) return;

        if (trimmed.length < 3) {
            alert('Nama barang minimal 3 karakter');
            return;
        }

        try {
            const res = await fetch(`/api/items/${editingItem.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: trimmed,
                    categoryId: formData.categoryId,
                    price: parseInt(formData.price) || 0
                })
            });

            if (res.ok) {
                setEditingItem(null);
                setFormData({ name: '', categoryId: '', price: '', initialStock: '0' });
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal update barang!');
            }
        } catch {
            alert('Gagal update barang!');
        }
    };


    const startEdit = (item: Item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            categoryId: item.categoryId,
            price: item.price.toString(),
            initialStock: '0'
        });
    };

    const filter = searchParams.get('filter');
    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.code.toLowerCase().includes(searchQuery.toLowerCase());

        if (filter === 'low-stock') {
            return matchesSearch && item.currentStock < 2;
        }

        return matchesSearch;
    });

    return (
        <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
            <header className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Link href="/" className="p-2 sm:p-3 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform">
                        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Link>
                    <h1 className="text-xl sm:text-3xl font-bold">
                        {filter === 'low-stock' ? 'Stok Tipis' : 'Daftar Barang'}
                    </h1>
                </div>
                {filter !== 'low-stock' && (
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="p-3 sm:p-4 bg-green-600 text-white flex items-center gap-2 rounded-xl sm:rounded-2xl font-bold active:scale-95 transition-all"
                    >
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="hidden sm:inline">Tambah</span>
                    </button>
                )}
            </header>

            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Cari nama atau kode barang..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full !p-4 !pl-12 !bg-white !rounded-2xl !border-slate-200 !shadow-sm !text-lg !font-medium focus:!border-blue-500 focus:!ring-4 focus:!ring-blue-100 transition-all"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                )}
            </div>

            {isAdding && (
                <form onSubmit={addItem} className="card space-y-4 border-green-200 bg-green-50/50 !p-4 sm:!p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg sm:text-xl font-bold text-green-800">
                            Barang Baru
                        </h2>
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="p-2 hover:bg-green-100 rounded-full"
                        >
                            <X className="w-5 h-5 text-green-600" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="!text-sm">Nama Barang</label>
                            <input
                                placeholder="Misal: Baut M6 10mm"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="!p-3"
                            />
                        </div>
                        <div>
                            <label className="!text-sm">Kategori</label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                className="!p-3"
                            >
                                <option value="">Pilih Kategori...</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="!text-sm">Harga (Rp)</label>
                            <input
                                type="number"
                                placeholder="50000"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="!p-3"
                            />
                        </div>
                        <div>
                            <label className="!text-sm">Stok Awal</label>
                            <input
                                type="number"
                                value={formData.initialStock}
                                onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
                                className="!p-3"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full p-4 bg-green-600 text-white rounded-xl font-bold active:scale-95 transition-all"
                    >
                        Tambah Barang
                    </button>
                </form>
            )}

            {loading ? (
                <p className="text-center text-slate-400 py-20">Memuat...</p>
            ) : items.length === 0 && !isAdding ? (
                <div className="card text-center py-20 opacity-50">
                    <Package className="w-20 h-20 mx-auto mb-4 text-slate-200" />
                    <p className="text-xl font-bold text-slate-400 italic">Belum ada barang terdaftar.</p>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="card text-center py-20 opacity-50 border-dashed">
                    <Search className="w-20 h-20 mx-auto mb-4 text-slate-200" />
                    <p className="text-xl font-bold text-slate-400 italic">Barang &quot;{searchQuery}&quot; tidak ditemukan.</p>
                    <button
                        onClick={() => setSearchQuery('')}
                        className="mt-4 text-blue-500 font-bold hover:underline"
                    >
                        Hapus pencarian
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="space-y-3">
                            <div className={`card flex items-start sm:items-center gap-3 sm:gap-6 !p-3 sm:!p-6 group transition-all ${editingItem?.id === item.id ? 'ring-4 ring-blue-100 border-blue-300' : ''}`}>
                                <div className="p-2 sm:p-4 bg-slate-100 rounded-lg sm:rounded-2xl shrink-0">
                                    <Package className="w-5 h-5 sm:w-10 sm:h-10 text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                        <span className="text-[10px] sm:text-sm font-bold bg-slate-200 px-2 py-0.5 rounded uppercase text-slate-700 font-mono">
                                            {item.code}
                                        </span>
                                        {item.categoryName && (
                                            <span className="text-[10px] sm:text-sm font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase truncate max-w-[120px] sm:max-w-none">
                                                {item.categoryName}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-base sm:text-3xl font-black text-slate-900 truncate sm:whitespace-normal group-hover:text-blue-600 transition-colors mb-1">
                                        {item.name}
                                    </h3>
                                    {item.price > 0 && (
                                        <p className="text-xs sm:text-lg text-slate-600 font-bold">
                                            Harga: <span className="text-blue-600">{formatPrice(item.price)}</span>
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-6 shrink-0">
                                    <div className="text-right">
                                        <p className="text-[10px] sm:text-sm font-black text-slate-500 uppercase tracking-tighter">STOK</p>
                                        <p className={`text-2xl sm:text-5xl font-black leading-none ${item.currentStock < 2 ? 'text-red-600' : 'text-slate-900'}`}>
                                            {item.currentStock}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1 shrink-0">
                                        <button
                                            onClick={() => editingItem?.id === item.id ? setEditingItem(null) : startEdit(item)}
                                            className={`p-2 rounded-lg transition-colors ${editingItem?.id === item.id ? 'bg-blue-600 text-white' : 'text-blue-500 hover:bg-blue-50'}`}
                                        >
                                            <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {editingItem?.id === item.id && (
                                <form onSubmit={updateItem} className="card space-y-4 border-blue-200 bg-blue-50/50 !p-4 sm:!p-6 animate-slide-up">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-bold text-blue-800">Edit Data Barang</h2>
                                        <button
                                            type="button"
                                            onClick={() => setEditingItem(null)}
                                            className="p-2 hover:bg-blue-100 rounded-full"
                                        >
                                            <X className="w-5 h-5 text-blue-600" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="!text-sm">Nama Barang</label>
                                            <input
                                                placeholder="Nama barang..."
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="!p-3"
                                            />
                                        </div>
                                        <div>
                                            <label className="!text-sm">Kategori</label>
                                            <select
                                                value={formData.categoryId}
                                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                                className="!p-3"
                                            >
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="!text-sm">Harga (Rp)</label>
                                            <input
                                                type="number"
                                                placeholder="Harga..."
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                className="!p-3"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setEditingItem(null)}
                                            className="flex-1 p-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold active:scale-95 transition-all"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-3 p-4 bg-blue-600 text-white rounded-xl font-bold active:scale-95 transition-all"
                                        >
                                            Simpan Perubahan
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    ))}
                </div>
            )}

        </main>
    );
}

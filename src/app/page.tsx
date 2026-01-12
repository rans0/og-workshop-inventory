'use client';

import React, { useState, useEffect } from 'react';
import { PlusCircle, MinusCircle, Package, History as HistoryIcon, Settings, ArrowRight, TrendingUp, X, Layers } from 'lucide-react';
import Link from 'next/link';

interface Item {
  id: string;
  code: string;
  name: string;
  currentStock: number;
}

interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'IN' | 'OUT';
  quantity: number;
  createdAt: string;
}

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}j`;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
};

// Quick Action Modal Component
function QuickActionModal({
  item,
  onRefresh,
  onClose
}: {
  item: Item;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const [isAdjusting, setIsAdjusting] = React.useState(false);
  const [newStock, setNewStock] = React.useState(item.currentStock.toString());
  const [submitting, setSubmitting] = React.useState(false);

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
              href="/items"
              className="block w-full text-center p-4 bg-slate-100 rounded-2xl text-slate-600 font-bold active:scale-95 transition-all"
            >
              Lihat Semua Barang
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, txRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/transactions?limit=5')
      ]);

      if (itemsRes.ok && txRes.ok) {
        setItems(await itemsRes.json());
        setTransactions(await txRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const lowStockItems = items.filter(i => i.currentStock < 5).slice(0, 3);

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900">Ratu Motor</h1>
          <p className="text-slate-500 font-medium text-sm sm:text-lg">Inventory & Stok Barang</p>
        </div>
        <Link href="/settings" className="p-2 sm:p-3 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform">
          <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
        </Link>
      </header>

      {/* Main Actions */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <Link href="/transaction/in" className="flex flex-col items-center justify-center p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg border-4 transition-all active:scale-95 text-center bg-green-600 text-white border-green-700 min-h-[120px] sm:min-h-[180px]">
          <PlusCircle className="w-10 h-10 sm:w-16 sm:h-16 mb-2 sm:mb-4" />
          <span className="text-lg sm:text-2xl font-black">MASUK</span>
          <span className="text-xs sm:text-sm opacity-80 mt-1 hidden sm:block">Tambah stok baru</span>
        </Link>
        <Link href="/transaction/out" className="flex flex-col items-center justify-center p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg border-4 transition-all active:scale-95 text-center bg-red-600 text-white border-red-700 min-h-[120px] sm:min-h-[180px]">
          <MinusCircle className="w-10 h-10 sm:w-16 sm:h-16 mb-2 sm:mb-4" />
          <span className="text-lg sm:text-2xl font-black">KELUAR</span>
          <span className="text-xs sm:text-sm opacity-80 mt-1 hidden sm:block">Catat barang keluar</span>
        </Link>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <Link href="/items" className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center active:scale-95 transition-all">
          <Package className="w-6 h-6 sm:w-10 sm:h-10 text-blue-600 mb-1 sm:mb-2" />
          <span className="font-bold text-slate-700 text-xs sm:text-base">Barang</span>
        </Link>
        <Link href="/history" className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center active:scale-95 transition-all">
          <HistoryIcon className="w-6 h-6 sm:w-10 sm:h-10 text-purple-600 mb-1 sm:mb-2" />
          <span className="font-bold text-slate-700 text-xs sm:text-base">Riwayat</span>
        </Link>
        <Link href="/reports" className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center active:scale-95 transition-all">
          <TrendingUp className="w-6 h-6 sm:w-10 sm:h-10 text-green-600 mb-1 sm:mb-2" />
          <span className="font-bold text-slate-700 text-xs sm:text-base">Laporan</span>
        </Link>
        <Link href="/categories" className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center active:scale-95 transition-all">
          <Layers className="w-6 h-6 sm:w-10 sm:h-10 text-orange-600 mb-1 sm:mb-2" />
          <span className="font-bold text-slate-700 text-xs sm:text-base">Kategori</span>
        </Link>
      </div>

      {/* Recently Updated */}
      <section className="card space-y-4 !p-4 sm:!p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            Terakhir Diupdate
          </h2>
          <Link href="/history" className="text-blue-600 font-bold flex items-center gap-1 text-sm">
            Semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <p className="text-center text-slate-400 py-6">Memuat...</p>
        ) : transactions.length === 0 ? (
          <p className="text-center text-slate-400 py-6 italic text-sm">Belum ada aktivitas.</p>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {transactions.map((tx) => {
              const item = items.find(i => i.id === tx.itemId);
              return (
                <button
                  key={tx.id}
                  onClick={() => item && setSelectedItem(item)}
                  className="w-full p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl flex justify-between items-center border border-slate-100 active:bg-slate-100 transition-colors text-left"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-bold text-base sm:text-xl truncate text-slate-900">{tx.itemName || 'Barang Terhapus'}</p>
                    <p className="text-slate-600 font-bold text-xs sm:text-base">Stok: {item?.currentStock ?? 0}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-black text-xl sm:text-2xl ${tx.type === 'IN' ? 'text-green-600' : 'text-red-700'}`}>
                      {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-500">{formatTimeAgo(tx.createdAt)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <section className="card border-red-100 bg-red-50/30 space-y-3 sm:space-y-4 !p-4 sm:!p-6">
          <h2 className="text-lg sm:text-xl font-bold text-red-800 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Stok Tipis!
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {lowStockItems.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-white p-3 rounded-xl border border-red-100 flex justify-between items-center active:bg-red-50 transition-colors"
              >
                <span className="font-bold text-slate-700 text-sm sm:text-base truncate mr-2">{item.name}</span>
                <span className="bg-red-600 text-white px-2 sm:px-3 py-1 rounded-full font-black text-xs sm:text-sm shrink-0">
                  {item.currentStock}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Quick Action Modal */}
      {selectedItem && (
        <QuickActionModal item={selectedItem} onRefresh={fetchData} onClose={() => setSelectedItem(null)} />
      )}
    </main>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { PlusCircle, MinusCircle, Package, History as HistoryIcon, Settings, ArrowRight, TrendingUp, Layers } from 'lucide-react';
import Link from 'next/link';
import QuickActionModal, { Item } from '@/components/QuickActionModal';

// QuickActionModal removed and moved to @/components/QuickActionModal

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

  const lowStockItems = items.filter(i => i.currentStock < 2).slice(0, 5);

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
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-bold text-red-800 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Stok Tipis!
            </h2>
            <Link href="/items?filter=low-stock" className="text-red-700 font-bold flex items-center gap-1 text-sm">
              Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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

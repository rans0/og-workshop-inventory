'use client';

import React from 'react';
import { PlusCircle, MinusCircle, Package, History as HistoryIcon, Settings, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import SyncStatus from '@/components/SyncStatus';

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return new Date(date).toLocaleDateString();
};

export default function Dashboard() {
  const recentTransactions = useLiveQuery(() =>
    db.transactions.orderBy('createdAt').reverse().limit(5).toArray()
  );

  const items = useLiveQuery(() => db.items.toArray());
  const lowStockItems = items?.filter(i => i.currentStock < 5).slice(0, 3);

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8 pb-12">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900">Bengkel Saya</h1>
          <p className="text-slate-500 font-medium text-lg">Inventory & Stok Barang</p>
        </div>
        <Link href="/settings" className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
          <Settings className="w-8 h-8 text-slate-400" />
        </Link>
      </header>

      {/* Sync Status */}
      <SyncStatus />

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/transaction/in" className="btn-huge btn-success">
          <PlusCircle className="w-16 h-16 mb-4" />
          <span className="text-2xl font-black">BARANG MASUK</span>
          <span className="text-sm opacity-80 mt-1">Tambah stok yang baru datang</span>
        </Link>
        <Link href="/transaction/out" className="btn-huge btn-danger">
          <MinusCircle className="w-16 h-16 mb-4" />
          <span className="text-2xl font-black">BARANG KELUAR</span>
          <span className="text-sm opacity-80 mt-1">Catat barang dipakai/dijual</span>
        </Link>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/items" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center active:scale-95 transition-all">
          <Package className="w-10 h-10 text-blue-600 mb-2" />
          <span className="font-bold text-slate-700">Daftar Barang</span>
        </Link>
        <Link href="/history" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center active:scale-95 transition-all">
          <HistoryIcon className="w-10 h-10 text-purple-600 mb-2" />
          <span className="font-bold text-slate-700">Riwayat</span>
        </Link>
        <Link href="/reports" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center active:scale-95 transition-all">
          <TrendingUp className="w-10 h-10 text-green-600 mb-2" />
          <span className="font-bold text-slate-700">Laporan</span>
        </Link>
        <Link href="/categories" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center active:scale-95 transition-all">
          <Settings className="w-10 h-10 text-orange-600 mb-2" />
          <span className="font-bold text-slate-700">Kategori</span>
        </Link>
      </div>

      {/* Recently Updated - Solving user's pain point */}
      <section className="card space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-blue-600" />
            Terakhir Diupdate
          </h2>
          <Link href="/history" className="text-blue-600 font-bold flex items-center gap-1">
            Lihat Semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {recentTransactions?.map((tx) => {
            const item = items?.find(i => i.id === tx.itemId);
            return (
              <div key={tx.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                <div>
                  <p className="font-bold text-lg">{item?.name || 'Barang Terhapus'}</p>
                  <p className="text-slate-500">Stok: {item?.currentStock} pcs</p>
                </div>
                <div className="text-right">
                  <p className={`font-black text-xl ${tx.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                  </p>
                  <p className="text-xs text-slate-400">{formatTimeAgo(tx.createdAt)}</p>
                </div>
              </div>
            );
          })}
          {recentTransactions?.length === 0 && (
            <p className="text-center text-slate-400 py-6 italic">Belum ada aktivitas.</p>
          )}
        </div>
      </section>

      {/* Low Stock Alert */}
      {lowStockItems && lowStockItems.length > 0 && (
        <section className="card border-red-100 bg-red-50/30 space-y-4">
          <h2 className="text-xl font-bold text-red-800 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Peringatan: Stok Tipis!
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {lowStockItems.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-xl border border-red-100 flex justify-between items-center">
                <span className="font-bold text-slate-700">{item.name}</span>
                <span className="bg-red-600 text-white px-3 py-1 rounded-full font-black text-sm">
                  Sisa {item.currentStock}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

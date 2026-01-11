'use client';

import React from 'react';
import { ArrowLeft, Info, Database, Wifi, Smartphone } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
    return (
        <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-20">
            <header className="flex items-center gap-4">
                <Link href="/" className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl sm:text-3xl font-bold">Pengaturan</h1>
            </header>

            {/* App Info */}
            <section className="card space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    Tentang Aplikasi
                </h2>
                <div className="space-y-3 text-slate-600">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="font-medium">Nama Aplikasi</span>
                        <span className="font-bold text-slate-800">Workshop Inventory</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="font-medium">Versi</span>
                        <span className="font-bold text-slate-800">1.0.0</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="font-medium">Framework</span>
                        <span className="font-bold text-slate-800">Next.js + Cloudflare</span>
                    </div>
                </div>
            </section>

            {/* Data Info */}
            <section className="card space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Database className="w-5 h-5 text-green-600" />
                    Penyimpanan Data
                </h2>
                <div className="space-y-3">
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Smartphone className="w-5 h-5 text-green-600" />
                            <span className="font-bold text-green-800">Data Lokal (Browser)</span>
                        </div>
                        <p className="text-sm text-green-700">
                            Data disimpan di browser menggunakan IndexedDB. Bisa diakses offline.
                        </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Wifi className="w-5 h-5 text-blue-600" />
                            <span className="font-bold text-blue-800">Data Cloud (Cloudflare D1)</span>
                        </div>
                        <p className="text-sm text-blue-700">
                            Data di-backup ke cloud saat online. Gunakan tombol &quot;Ambil dari Cloud&quot; untuk sinkronisasi.
                        </p>
                    </div>
                </div>
            </section>

            {/* Usage Tips */}
            <section className="card space-y-4 bg-amber-50 border-amber-100">
                <h2 className="text-xl font-bold text-amber-800">💡 Tips Penggunaan</h2>
                <ul className="space-y-2 text-amber-700">
                    <li className="flex gap-2">
                        <span>•</span>
                        <span>Tekan lama pada kartu barang untuk opsi cepat</span>
                    </li>
                    <li className="flex gap-2">
                        <span>•</span>
                        <span>Stok di bawah 5 akan muncul sebagai peringatan</span>
                    </li>
                    <li className="flex gap-2">
                        <span>•</span>
                        <span>Data tetap aman meski internet mati</span>
                    </li>
                </ul>
            </section>
        </main>
    );
}

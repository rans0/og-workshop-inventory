'use client';

import React from 'react';
import { ArrowLeft, Info, Database, Wifi, LogOut, ChevronRight, User, ShieldCheck, History as HistoryIcon, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
    const handleLogout = () => {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            sessionStorage.removeItem('is_auth');
            window.location.href = '/';
        }
    };

    const APP_NAME = "Ratu Motor";
    const APP_VERSION = "1.1.0"; // Incremented for the new UI updates

    return (
        <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
            <header className="flex items-center gap-4">
                <Link href="/" className="p-2 sm:p-3 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform">
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                </Link>
                <h1 className="text-xl sm:text-3xl font-bold text-slate-800">Pengaturan</h1>
            </header>

            {/* Account / Profile Section */}
            <section className="space-y-3">
                <h2 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Akun & Keamanan</h2>
                <div className="card !p-0 overflow-hidden">
                    <div className="p-4 sm:p-6 flex items-center gap-4 border-b border-slate-50">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                            <User className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-base sm:text-xl font-bold text-slate-800 truncate">Administrator</p>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium">Akses Penuh Keamanan</p>
                        </div>
                        <div className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                            Aktif
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-red-50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 text-red-500 rounded-lg group-hover:bg-red-100">
                                <LogOut className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-slate-700 group-hover:text-red-600">Keluar dari Aplikasi</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-red-300" />
                    </button>
                </div>
            </section>

            {/* Deleted Data Section */}
            <section className="space-y-3">
                <h2 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Manajemen Data</h2>
                <div className="card !p-0 overflow-hidden">
                    <Link
                        href="/settings/deleted"
                        className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 text-orange-500 rounded-lg group-hover:bg-orange-100">
                                <HistoryIcon className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-slate-700">Barang & Kategori Terhapus</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />
                    </Link>
                </div>
            </section>

            {/* Storage Info */}
            <section className="space-y-3">
                <h2 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Koneksi & Database</h2>
                <div className="card !p-4 sm:!p-6 bg-blue-50/30 border-blue-100 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    <div className="p-3 sm:p-5 bg-white rounded-2xl shadow-sm border border-blue-50 shrink-0">
                        <Wifi className="w-6 h-6 sm:w-10 sm:h-10 text-blue-500" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-base sm:text-xl text-blue-900">Cloud Server Aktif</span>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        </div>
                        <p className="text-xs sm:text-sm text-blue-700/70 leading-relaxed font-medium">
                            Aplikasi berjalan secara online penuh. Semua data transaksi langsung disimpan ke server Cloudflare D1 secara real-time untuk keamanan maksimal.
                        </p>
                    </div>
                </div>
            </section>

            {/* App Info */}
            <section className="space-y-3">
                <h2 className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Tentang</h2>
                <div className="card !p-2">
                    <Link href="/settings/tutorial" className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100">
                                <BookOpen className="w-4 h-4" />
                            </div>
                            <span className="text-sm sm:text-base font-bold text-slate-700">Tutorial & SOP</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />
                    </Link>
                    {[
                        { label: 'Nama Bisnis', value: APP_NAME, icon: <ShieldCheck className="w-4 h-4 text-blue-500" /> },
                        { label: 'Versi Aplikasi', value: APP_VERSION, icon: <Info className="w-4 h-4 text-slate-400" /> },
                        { label: 'Mesin Database', value: 'Cloudflare D1', icon: <Database className="w-4 h-4 text-green-500" /> }
                    ].map((item, idx, arr) => (
                        <div key={item.label} className={`flex items-center justify-between p-3 sm:p-4 ${idx !== arr.length - 1 ? 'border-b border-slate-50' : ''}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-slate-50 rounded-lg">
                                    {item.icon}
                                </div>
                                <span className="text-sm sm:text-base font-medium text-slate-600">{item.label}</span>
                            </div>
                            <span className="text-sm sm:text-base font-bold text-slate-800">{item.value}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Usage Tips */}
            <section className="card bg-amber-50/50 border-amber-100 !p-5">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">💡</span>
                    <h3 className="font-bold text-amber-900">Tips Penggunaan</h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    {[
                        'Klik pada kartu barang di dashboard untuk transaksi kilat.',
                        'Laporan uang modal dihitung dari harga beli yang Anda masukkan.',
                        'Pastikan internet stabil agar data selalu sinkron dengan pusat.'
                    ].map((tip, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                            <p className="text-xs sm:text-sm text-amber-800/80 font-medium leading-relaxed">{tip}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="text-center pt-4">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Build with ❤️ for Ratu Motor</p>
            </footer>
        </main>
    );
}

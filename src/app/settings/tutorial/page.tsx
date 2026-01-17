'use client';

import React from 'react';
import { ArrowLeft, BookOpen, PlusCircle, MinusCircle, RefreshCw, BarChart3, Trash2, Info } from 'lucide-react';
import Link from 'next/link';

const SopSection = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <section className="card space-y-4 !p-6 border-slate-100">
        <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                {icon}
            </div>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        </div>
        <div className="space-y-4 text-slate-600 leading-relaxed font-medium">
            {children}
        </div>
    </section>
);

export default function TutorialPage() {
    return (
        <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
            <header className="flex items-center gap-4">
                <Link href="/settings" className="p-2 sm:p-3 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform">
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-3xl font-bold text-slate-800">Tutorial & SOP</h1>
                    <p className="text-sm text-slate-500 font-medium font-mono uppercase tracking-tighter">Panduan Operasional Ratu Motor</p>
                </div>
            </header>

            <div className="bg-blue-600 p-6 rounded-3xl text-white space-y-2 shadow-lg shadow-blue-100">
                <div className="flex items-center gap-2">
                    <BookOpen className="w-6 h-6" />
                    <h2 className="text-xl font-bold">Selamat Datang!</h2>
                </div>
                <p className="text-blue-50/80 font-medium">Ini adalah panduan resmi penggunaan sistem inventory. Pastikan setiap staf mengikuti prosedur ini untuk menjaga akurasi data stok.</p>
            </div>

            {/* Section: Barang Masuk */}
            <SopSection icon={<PlusCircle className="w-6 h-6" />} title="SOP Barang Masuk">
                <p>Gunakan alur ini saat ada **belanja barang baru** atau tambahan stok dari supplier.</p>
                <ol className="list-decimal list-inside space-y-2 ml-1">
                    <li>Klik tombol <span className="text-green-600 font-bold">MASUK</span> di dashboard.</li>
                    <li>Cari nama barang melalui kolom pencarian.</li>
                    <li>Masukkan **Jumlah** barang yang datang.</li>
                    <li>Pastikan **Harga Beli** sesuai dengan nota terbaru (ini penting untuk laporan modal).</li>
                    <li>Klik Simpan. Stok akan bertambah secara real-time.</li>
                </ol>
            </SopSection>

            {/* Section: Barang Keluar */}
            <SopSection icon={<MinusCircle className="w-6 h-6" />} title="SOP Barang Keluar">
                <p>Gunakan alur ini setiap kali barang **diambil untuk servis** atau dijual.</p>
                <ol className="list-decimal list-inside space-y-2 ml-1">
                    <li>Klik tombol <span className="text-red-700 font-bold">KELUAR</span> di dashboard.</li>
                    <li>Pilih barang yang digunakan.</li>
                    <li>Masukkan jumlah pengeluaran.</li>
                    <li>Opsional: Tambahkan **Catatan** (misal: &quot;Servis Vario Putih&quot;).</li>
                    <li>Klik Simpan. Sistem akan otomatis memotong stok.</li>
                </ol>
            </SopSection>

            {/* Section: Revisi Stok */}
            <SopSection icon={<RefreshCw className="w-6 h-6" />} title="SOP Revisi Stok (Koreksi)">
                <p>Lakukan revisi jika jumlah stok di sistem berbeda dengan **stok fisik di rak** (karena lupa input atau salah hitung).</p>
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex gap-3 text-orange-800 text-sm">
                    <Info className="w-5 h-5 shrink-0" />
                    <p>Jangan gunakan fitur ini untuk transaksi biasa. Gunakan hanya untuk **Audit Stok Bulanan**.</p>
                </div>
                <ol className="list-decimal list-inside space-y-2 ml-1">
                    <li>Di dashboard atau **halaman Riwayat**, klik nama barang/transaksi yang ingin dikoreksi.</li>
                    <li>Pilih menu <span className="text-orange-600 font-bold">Koreksi Stok (Edit Langsung)</span>.</li>
                    <li>Ketik jumlah stok fisik yang ada di depan mata Anda.</li>
                    <li>Sistem akan otomatis mencatat riwayat transaksi dengan label <span className="bg-slate-200 px-1.5 rounded">ADJUSTMENT</span>.</li>
                </ol>
            </SopSection>

            {/* Section: Laporan */}
            <SopSection icon={<BarChart3 className="w-6 h-6" />} title="Membaca Menu Laporan">
                <p>Menu ini membantu Anda melihat perputaran uang dan barang.</p>
                <ul className="list-disc list-inside space-y-3 ml-1">
                    <li>
                        <span className="font-bold text-blue-600 uppercase text-xs">Uang Modal (Belanja):</span>
                        <br /><span className="ml-5">Total nilai uang yang keluar untuk membeli stok (Harga Beli × Jumlah Masuk).</span>
                    </li>
                    <li>
                        <span className="font-bold text-orange-700 uppercase text-xs">Uang Keluar (Pemakaian):</span>
                        <br /><span className="ml-5">Total nilai aset yang telah digunakan atau keluar dari gudang.</span>
                    </li>
                    <li>
                        <span className="font-bold text-slate-800 uppercase text-xs">Filter Periode:</span>
                        <br /><span className="ml-5">Gunakan pilihan Kalender (Mulai & Sampai Tanggal) di bagian atas untuk melihat performa dalam rentang waktu yang spesifik.</span>
                    </li>
                </ul>
            </SopSection>


            <footer className="text-center pt-8">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">SOP Versi 2.0 • Ratu Motor</p>
            </footer>
        </main>
    );
}

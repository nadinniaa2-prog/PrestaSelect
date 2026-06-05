/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Award, CheckCircle, ChevronRight, Compass, ShieldAlert, Sparkles, TrendingUp, Users, Sliders, Info, Heart } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Award className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="font-sans font-bold text-lg tracking-tight text-slate-950">PrestaSelect</span>
              <span className="block text-[10px] font-mono font-medium tracking-wide text-indigo-600 uppercase">SPK Seleksi Lomba</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              id="landing-learn-more"
              onClick={() => {
                const docSection = document.getElementById('apa-itu-spk');
                docSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block pointer-events-auto cursor-pointer"
            >
              Tentang SPK
            </button>
            <button 
              id="landing-login"
              onClick={() => onNavigate('/login')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 flex items-center gap-1.5 cursor-pointer"
            >
              Masuk Aplikasi
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),theme(colors.slate.50))]" />
        
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex flex-col gap-6 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              Sistem Pendukung Keputusan Objektif & Transparan
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-sans font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight text-slate-950 leading-[1.1]"
            >
              Menentukan Peserta Terbaik secara <span className="text-indigo-600 bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text">Adil & Presisi</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed"
            >
              <strong>PrestaSelect</strong> adalah media modern berbasis keputusan ilmiah untuk menyaring, mengukur, dan merekomendasikan pemenang atau duta lomba berprestasi. Menggunakan metode matematis <strong>Simple Additive Weighting (SAW)</strong> untuk efisiensi penuh tanpa keraguan subjektif.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center pt-4 w-full sm:w-auto"
            >
              <button 
                id="hero-go-app"
                onClick={() => onNavigate('/login')}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 text-base font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 flex items-center justify-center gap-2 cursor-pointer"
              >
                Buka Aplikasi SPK
                <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                id="hero-learn"
                onClick={() => {
                  const docSection = document.getElementById('apa-itu-spk');
                  docSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-8 py-4 text-base font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Pelajari Metode SAW
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Explanation of DSS / SPK Section */}
      <section id="apa-itu-spk" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-sans font-extrabold text-3xl sm:text-4xl text-slate-950 tracking-tight">
              Mengenal Sistem Pendukung Keputusan (SPK)
            </h2>
            <div className="h-1.5 w-16 bg-indigo-600 rounded-full mx-auto my-4" />
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              Sistem Pendukung Keputusan (Decision Support System) adalah perangkat lunak interaktif yang membantu pengambil keputusan (seperti dewan guru, kepala sekolah, atau panitia) memecahkan masalah semi-terstruktur dengan memodifikasi data mentah menjadi keputusan nyata bernilai ilmiah.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-150 flex items-center justify-center text-indigo-700">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Pengambilan Keputusan Terarah</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Menghapus intervensi suka/tidak suka (like-and-dislike) dengan menstandarkan setiap parameter penilaian secara transparan dan berimbang.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-150 flex items-center justify-center text-indigo-700">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Metode SAW (Metode Pembobotan)</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                <em>Simple Additive Weighting</em> sering dikenal sebagai metode penjumlahan terbobot. Memungkinkan kriteria <strong>Benefit</strong> (makin besar semakin baik) dan <strong>Cost</strong> (makin kecil semakin berharga) dianalisis bersamaan secara presisi.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-150 flex items-center justify-center text-indigo-700">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Visualisasi & Hasil Seketika</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Membantu panitia mendapatkan tabel perangkingan yang telah dinormalisasi lengkap dengan grafik real-time dan opsi kelayakan dalam hitungan detik.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Flow Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-sans font-extrabold text-3xl text-slate-950 tracking-tight">
              Alur Pengoperasian Sistem Seleksi
            </h2>
            <p className="text-slate-500 text-sm mt-2">Empat langkah mudah pengambil keputusan untuk memfinalisasi peserta lomba terbaik</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="relative group">
              <div className="absolute top-4 left-6 -z-10 text-7xl font-mono font-black text-slate-200">01</div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-full flex flex-col gap-2">
                <h4 className="font-bold text-slate-950 mt-4">Tentukan Kriteria & Bobot</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tentukan aspek yang dinilai (C1, C2, dsb.), tentukan jenis kriteria dan bobot prioritasnya (akumulasi bobot wajib 100%).
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute top-4 left-6 -z-10 text-7xl font-mono font-black text-slate-200">02</div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-full flex flex-col gap-2">
                <h4 className="font-bold text-slate-950 mt-4">Kelola Data Peserta</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Daftarkan seluruh peserta (Siswa atau Guru), lengkapi dengan nomor induk (NISN/NIP) serta instansi asal masing-masing.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute top-4 left-6 -z-10 text-7xl font-mono font-black text-slate-200">03</div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-full flex flex-col gap-2">
                <h4 className="font-bold text-slate-950 mt-4">Input Skor/Nilai Mandiri</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Isikan skor mentah untuk setiap kriteria yang telah dibuat sebelumnya. Admin memegang kendali atas keakuratan pengisian nilai.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute top-4 left-6 -z-10 text-7xl font-mono font-black text-slate-200">04</div>
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-full flex flex-col gap-2">
                <h4 className="font-bold text-slate-950 mt-4">Proses Kalkulasi & Putuskan</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sistem mengeksekusi perhitungan penormalan matriks benefit/cost dan menyeleksi pemenang. Putuskan dengan menekan tombol lolos final.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium CTA Footer Card */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-indigo-900 rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-xl">
            <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
            
            <h2 className="text-2xl sm:text-3xl font-extrabold font-sans mb-4 tracking-tight">Siap Melakukan Seleksi Berkinerja Tinggi?</h2>
            <p className="text-indigo-200/90 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
              Masuk ke akun Anda sekarang. Dapatkan akses penuh ke panel administrator pengelola seleksi secara mudah.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                id="footer-login-admin"
                onClick={() => onNavigate('/login')}
                className="bg-white text-indigo-900 border border-transparent font-bold py-3.5 px-8 rounded-xl text-sm hover:bg-indigo-50 transition-colors pointer-events-auto cursor-pointer"
              >
                Masuk ke Panel Admin
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Standard Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 font-mono text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="font-sans font-bold text-slate-150">PrestaSelect SPK</p>
              <p className="text-[10px] text-slate-500">Sistem Pendukung Keputusan Seleksi Peserta</p>
            </div>
          </div>

          <p className="text-center sm:text-right text-slate-500">
            &copy; 2026 PrestaSelect. Built under Expert Programmatic standard architecture.
          </p>
        </div>
      </footer>
    </div>
  );
}

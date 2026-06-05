/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Kriteria, Peserta, Nilai } from '../types';
import { Award, CheckCircle, Database, HelpCircle, ArrowRight, Percent, Users, FileCheck, ClipboardList, Info, Terminal } from 'lucide-react';
import { isUsingSupabase, SUPABASE_SQL_SCHEMA } from '../lib/db';
import { useState } from 'react';

interface DashboardTabProps {
  kriteria: Kriteria[];
  peserta: Peserta[];
  nilai: Nilai[];
  onNavigateTab: (tab: string) => void;
  userRole: string;
}

export default function DashboardTab({ kriteria, peserta, nilai, onNavigateTab, userRole }: DashboardTabProps) {
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Stats calculation
  const totalKriteria = kriteria.length;
  const totalPeserta = peserta.length;
  
  // Checking how many contestants have their scoring fully completed
  const completedScorings = peserta.filter(p => {
    const scoresForPeserta = nilai.filter(n => n.peserta_id === p.id);
    return scoresForPeserta.length >= kriteria.length && kriteria.length > 0;
  }).length;

  const totalDecisions = peserta.filter(p => p.status_keputusan === 'lolos').length;
  const totalBobotSum = kriteria.reduce((acc, k) => acc + k.bobot, 0);
  const isWeightIdeal = totalBobotSum === 100;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Dynamic welcome message */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl relative overflow-hidden shadow-lg border border-slate-800">
        {/* Decorative Grid Line Graphics */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />
        <div className="absolute top-0 right-0 w-[45%] h-full bg-indigo-600/15 rounded-l-full blur-3xl opacity-80" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="bg-indigo-500/25 text-indigo-300 font-bold font-mono tracking-wider text-[9px] uppercase px-2.5 py-1 rounded border border-indigo-500/30 inline-flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              Sistem Pendukung Keputusan v1.0
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight font-sans text-white">
              PrestaSelect SPK Selection Engine
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Selamat datang di dashboard penilai {userRole === 'admin' ? 'pimpinan' : 'fungsional'}. Gunakan metode SAW (Simple Additive Weighting) untuk mengolah bobot parameter, me-normalisasi skor benefit & cost, serta meloloskan kandidat pemenang secara akurat dan objektif tanpa rekayasa.
            </p>
          </div>
          <button
            id="dash-start-calculation"
            onClick={() => onNavigateTab('proses')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 text-xs font-bold font-mono tracking-wider rounded-xl uppercase transition-all shadow-md hover:shadow-indigo-600/35 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer shrink-0"
          >
            Mulai Hitung SPK
            <ArrowRight className="w-4 h-4 text-indigo-200" />
          </button>
        </div>
      </div>

      {/* Main Stats Bento Grid */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-mono">Ikhtisar Seleksi Terkini</h3>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-205">
          Realtime Summary
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Criteria Stat Card */}
        <div 
          onClick={() => onNavigateTab('kriteria')}
          className="bg-white border border-slate-205 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-350 cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col justify-between h-36 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Total Kriteria</span>
            <div className="w-8.5 h-8.5 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Percent className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black font-sans text-slate-950 leading-none">{totalKriteria}</p>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isWeightIdeal ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <span className="text-[10px] text-slate-500 font-mono font-medium">
                Total Bobot: {totalBobotSum}%
              </span>
            </div>
          </div>
        </div>

        {/* Total Contestants Stat Card */}
        <div 
          onClick={() => onNavigateTab('peserta')}
          className="bg-white border border-slate-205 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-355 cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col justify-between h-36 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Daftar Peserta</span>
            <div className="w-8.5 h-8.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black font-sans text-slate-950 leading-none">{totalPeserta}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-2">Siswa & Guru Terdaftar</p>
          </div>
        </div>

        {/* Scored Stat Card */}
        <div 
          onClick={() => onNavigateTab(userRole === 'admin' ? 'nilai' : 'proses')}
          className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col justify-between h-36 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Selesai Dinilai</span>
            <div className="w-8.5 h-8.5 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <FileCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black font-sans text-slate-950 leading-none">
              {completedScorings}
              <span className="text-base font-normal text-slate-400 ml-0.5">/{totalPeserta}</span>
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-2 font-medium">Buku Input Skor Terisi</p>
          </div>
        </div>

        {/* Finalized Decision Winner Stat Card */}
        <div 
          onClick={() => onNavigateTab('proses')}
          className="bg-white border border-slate-205 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-355 cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col justify-between h-36 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Lolos Final/Pemenang</span>
            <div className="w-8.5 h-8.5 rounded-xl bg-yellow-50 border border-yellow-105 flex items-center justify-center text-yellow-600 group-hover:scale-110 transition-transform">
              <Award className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black font-sans text-slate-950 leading-none">{totalDecisions}</p>
            <p className="text-[10px] text-slate-405 font-mono mt-2 font-medium">Pemenang Ditunjuk</p>
          </div>
        </div>

      </div>

      {/* Main Content Layout Grid */}
      <div className="grid lg:grid-cols-12 gap-6 pt-2">
        
        {/* Left column: Participant list preview */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                <h4 className="font-sans font-bold text-slate-900 text-sm">Pratinjau Keikutsertaan Peserta</h4>
              </div>
              <button 
                id="dash-expand-peserta"
                onClick={() => onNavigateTab('peserta')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer block"
              >
                Lihat Semua
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {peserta.slice(0, 4).map((p) => {
                const isScored = nilai.filter(n => n.peserta_id === p.id).length >= kriteria.length;
                return (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">{p.nama}</p>
                      <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{p.nisn_nip} &bull; {p.instansi}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {p.status_keputusan === 'lolos' ? (
                        <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 font-bold border border-emerald-150 px-2 py-0.5 rounded-full">
                          🏆 Lolos Final
                        </span>
                      ) : isScored ? (
                        <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 font-semibold border border-indigo-150 px-2 py-0.5 rounded-full">
                          Dinilai
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">
                          Skor Belum Lengkap
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {peserta.length === 0 && (
                <div className="py-8 text-center text-slate-400">
                  <p className="text-xs">Belum ada peserta terdaftar.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 mt-4 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">Daftar di atas disortir berdasar urutan database</span>
            {userRole === 'admin' && (
              <button
                id="dash-add-peserta"
                onClick={() => onNavigateTab('peserta')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                Tambah Peserta Baru +
              </button>
            )}
          </div>
        </div>

        {/* Right column: Database settings & SQL schema guidelines */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Supabase SQL Integration Helper Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-5 h-5 text-indigo-600" />
              <h4 className="font-sans font-bold text-slate-900 text-sm">Integrasi Supabase & Schema</h4>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Aplikasi ini dikembangkan untuk mendukung sinkronisasi dynamic real-time database dari Supabase. Anda dapat menyalin skema SQL langsung untuk membuat tabel pada konsol database online Supabase Anda.
            </p>

            <div className="space-y-2.5">
              <button
                id="dash-open-sql-btn"
                onClick={() => setShowSqlModal(true)}
                className="w-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold font-mono py-2.5 px-4 rounded-xl shadow-sm transition-colors text-center cursor-pointer block pointer-events-auto"
              >
                Lihat Query SQL Supabase
              </button>

              <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-800">
                <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                <p className="text-[10px] font-medium leading-normal">
                  Masukkan variabel <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> di Secrets Panel untuk menghubungkan cloud database Anda!
                </p>
              </div>
            </div>
          </div>

          {/* SPK Information Widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2.5">
              <HelpCircle className="w-5 h-5 text-purple-600" />
              <h4 className="font-sans font-bold text-slate-900 text-sm">Bagaimana SAW dihitung?</h4>
            </div>
            <p className="text-xs text-slate-500 leading-normal">
              Metode SAW menormalisasi skor awal berdasarkan jenis kriteria:
            </p>
            <ul className="text-[11px] font-mono text-slate-600 list-disc list-inside mt-2 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <li>Benefit: (Nilai / Max Nilai)</li>
              <li>Cost: (Min Nilai / Nilai)</li>
              <li>Preferensi: Jumlah perkalian Ternormalisasi & Bobot Kriteria</li>
            </ul>
          </div>

        </div>
      </div>

      {/* SQL Script Viewer Dialog Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-300 shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-slate-900">
                <Terminal className="w-5 h-5 text-indigo-600" />
                <h4 className="font-sans font-bold text-sm">Skema Database SQL Supabase</h4>
              </div>
              <button
                id="dash-close-sql-btn"
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-900 text-slate-300 font-mono text-xs leading-normal">
              <p className="text-slate-400 mb-4 font-sans text-xs">
                -- Tempel skema berikut ke dalam panel <strong>"SQL Editor"</strong> di dashboard Console Supabase Anda, lalu jalankan (Run).
              </p>
              <pre className="whitespace-pre-wrap select-all">{SUPABASE_SQL_SCHEMA}</pre>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-mono">Siap diintegrasikan kapan saja</span>
              <div className="flex gap-2">
                <button
                  id="dash-copy-sql-btn"
                  onClick={handleCopySql}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {copied ? 'Tersalin! ✔' : 'Salin Script'}
                </button>
                <button
                  id="dash-dismiss-sql-btn"
                  onClick={() => setShowSqlModal(false)}
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

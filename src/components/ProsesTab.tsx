/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Kriteria, Peserta, Nilai, SAWResult } from '../types';
import { db } from '../lib/db';
import { Award, Compass, Sparkles, TrendingUp, Info, ShieldAlert, BarChart3, CheckCircle, RefreshCw, Star } from 'lucide-react';

interface ResOutput {
  id: string;
  peserta: Peserta;
  scores: Record<string, number>;
}

interface NormalizationOutput {
  id: string;
  peserta: Peserta;
  normalized: Record<string, number>;
}

interface FinalWeightsOutput {
  id: string;
  peserta: Peserta;
  weightedScore: Record<string, number>;
  totalScore: number;
}

interface ProsesTabProps {
  kriteria: Kriteria[];
  peserta: Peserta[];
  nilai: Nilai[];
  onDecideWinner: (pesertaId: string, status: 'lolos' | 'tidak_lolos' | null) => Promise<void>;
  userRole: string;
}

export default function ProsesTab({ kriteria, peserta, nilai, onDecideWinner, userRole }: ProsesTabProps) {
  const isAdmin = userRole === 'admin';

  // Sub-step layout inside SPK Proses
  const [calculationStep, setCalculationStep] = useState<'raw' | 'normalized' | 'pref'>('pref');
  const [results, setResults] = useState<SAWResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quota selection for automatic passing: defaults to 2, stored in localStorage
  const [quota, setQuota] = useState<number>(() => {
    return Number(localStorage.getItem('presta_quota') || '2');
  });
  const [quotaInput, setQuotaInput] = useState<string>(String(quota));

  // Keep quotaInput in sync if quota is updated from external factors
  useEffect(() => {
    setQuotaInput(String(quota));
  }, [quota]);

  const handleQuotaInputChange = (val: string) => {
    setQuotaInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= 100) {
      setQuota(num);
      localStorage.setItem('presta_quota', String(num));
    }
  };

  const handleQuotaBlur = () => {
    let num = parseInt(quotaInput, 10);
    if (isNaN(num) || num < 1) {
      num = 1;
    } else if (num > 100) {
      num = 100;
    }
    setQuota(num);
    setQuotaInput(String(num));
    localStorage.setItem('presta_quota', String(num));
  };

  // Perform full SAW SPK math
  const calculateSAW = () => {
    setErrorMessage(null);

    if (kriteria.length === 0) {
      setErrorMessage('Kriteria tidak boleh kosong. Harap tambahkan setidaknya 1 kriteria penilaian.');
      return;
    }
    if (peserta.length === 0) {
      setErrorMessage('Peserta seleksi kosong. Harap daftarkan peserta terlebih dahulu.');
      return;
    }

    // Step 1: Initial Array
    // Find missing scores
    const incompletePeserta: string[] = [];
    const matrixScores: Record<string, Record<string, number>> = {};

    peserta.forEach(p => {
      matrixScores[p.id] = {};
      kriteria.forEach(k => {
        const found = nilai.find(n => n.peserta_id === p.id && n.kriteria_id === k.id);
        if (found) {
          matrixScores[p.id][k.id] = found.skor;
        } else {
          // If a score is missing from the DB, warn user instead of failing
          matrixScores[p.id][k.id] = 0; // fallback to 0 but flag as incomplete
          if (!incompletePeserta.includes(p.nama)) {
            incompletePeserta.push(p.nama);
          }
        }
      });
    });

    // Step 2: Extract Extremes (Max and Min scores per criteria across all contestants)
    const maxScores: Record<string, number> = {};
    const minScores: Record<string, number> = {};

    kriteria.forEach(k => {
      let maxVal = -Infinity;
      let minVal = Infinity;

      peserta.forEach(p => {
        const val = matrixScores[p.id][k.id] || 0;
        if (val > maxVal) maxVal = val;
        if (val < minVal) minVal = val;
      });

      // Avoid division by zero
      maxScores[k.id] = maxVal === 0 ? 1 : maxVal;
      minScores[k.id] = minVal === 0 ? 1 : minVal;
    });

    // Step 3: Normalization & Preference Addition
    const computedResults: SAWResult[] = peserta.map(p => {
      const pScores = matrixScores[p.id] || {};
      const normScores: Record<string, number> = {};
      let totalPreference = 0;

      kriteria.forEach(k => {
        const rawValue = pScores[k.id] || 0;
        // Normalization formulas
        let normValue = 0;
        if (k.jenis === 'benefit') {
          normValue = rawValue / maxScores[k.id];
        } else {
          // Cost: min / x
          normValue = rawValue === 0 ? 0 : minScores[k.id] / rawValue;
        }

        normScores[k.id] = normValue;

        // Multiply by normalized weight (total Bobot percent as decimal: e.g., 30% -> 0.3)
        const decimalWeight = k.bobot / 100;
        totalPreference += normValue * decimalWeight;
      });

      return {
        peserta: p,
        skorAwal: pScores,
        skorNormalisasi: normScores,
        nilaiPreferensi: parseFloat(totalPreference.toFixed(4)),
        ranking: 0 // Will assign rank after sorting
      };
    });

    // Step 4: Sort and rank
    computedResults.sort((a, b) => b.nilaiPreferensi - a.nilaiPreferensi);
    computedResults.forEach((res, index) => {
      res.ranking = index + 1;
    });

    setResults(computedResults);
    
    // Warning if incomplete
    if (incompletePeserta.length > 0) {
      setErrorMessage(
        `Skor untuk peserta berikut belum lengkap (${incompletePeserta.join(', ')}). Sistem mengasumsikan nilai 0 untuk criteria kosong.`
      );
    }
  };

  // Re-calculate when participants, criteria, or scores database changes
  useEffect(() => {
    calculateSAW();
  }, [kriteria, peserta, nilai]);

  // Safely auto-reconcile "Lolos Otomatis" status in the database based on Quota and SAW rank
  useEffect(() => {
    if (results.length === 0 || !isAdmin) return;

    let passedCount = 0;
    const updates: { id: string; status: 'lolos' | 'tidak_lolos' | null }[] = [];
    let hasChanges = false;

    for (const res of results) {
      const p = res.peserta;
      let targetStatus: 'lolos' | 'tidak_lolos' | null = null;

      if (p.status_keputusan === 'tidak_lolos') {
        targetStatus = 'tidak_lolos';
      } else if (passedCount < quota) {
        targetStatus = 'lolos';
        passedCount++;
      } else {
        targetStatus = null;
      }

      if (p.status_keputusan !== targetStatus) {
        hasChanges = true;
        updates.push({ id: p.id, status: targetStatus });
      }
    }

    if (hasChanges) {
      const applyUpdates = async () => {
        for (const u of updates) {
          const item = peserta.find(p => p.id === u.id);
          if (item) {
            const updatedItem: Peserta = {
              ...item,
              status_keputusan: u.status,
              selected_at: u.status === 'lolos' ? (item.selected_at || new Date().toISOString()) : undefined
            };
            await db.savePesertaItem(updatedItem);
          }
        }
        await onDecideWinner('', null);
      };
      applyUpdates();
    }
  }, [results, quota, peserta, isAdmin]);

  const handleDecision = async (pesertaId: string, status: 'lolos' | 'tidak_lolos' | null) => {
    if (!isAdmin) return;
    setProcessing(true);
    try {
      await onDecideWinner(pesertaId, status);
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah keputusan final.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Dynamic Sub-Step tab selectors for Calculations */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 flex gap-1 shadow-sm">
        <button
          id="proses-step-pref"
          onClick={() => setCalculationStep('pref')}
          className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            calculationStep === 'pref' 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          3. Peringkat & Kelulusan Final
        </button>
        <button
          id="proses-step-normalized"
          onClick={() => setCalculationStep('normalized')}
          className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            calculationStep === 'normalized' 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          2. Normalisasi Matriks (R)
        </button>
        <button
          id="proses-step-raw"
          onClick={() => setCalculationStep('raw')}
          className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            calculationStep === 'raw' 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Compass className="w-4 h-4" />
          1. Tabel Matriks Awal (X)
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 font-medium flex gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* RENDER VIEW ACCORDING TO USER STEP SELECTION */}

      {/* STEP 1: RAW MATRIX (X) */}
      {calculationStep === 'raw' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-sans font-bold text-slate-900 text-sm">Matriks Keputusan Awal (X)</h4>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Berisi nilai mentah inputan yang dikonfirmasi oleh Admin.</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-white border border-slate-150 py-1.5 px-3 rounded-lg text-slate-500">
              Formulas: [X_ij]
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-6">ID</th>
                  <th className="py-3 px-6">Nama Peserta</th>
                  {kriteria.map(k => (
                    <th key={k.id} className="py-3 px-6 text-center font-bold">
                      {k.id} <span className="text-[9px] font-normal lowercase block">({k.jenis})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {results.map((res) => (
                  <tr key={res.peserta.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-6 font-mono font-bold text-indigo-600">{res.peserta.id}</td>
                    <td className="py-3 px-6">
                      <p className="font-bold text-slate-900">{res.peserta.nama}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{res.peserta.instansi}</p>
                    </td>
                    {kriteria.map(k => {
                      const score = res.skorAwal[k.id] || 0;
                      return (
                        <td key={k.id} className="py-3 px-6 text-center font-mono font-bold text-slate-850">
                          {score}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEP 2: NORMALIZED MATRIX (R) */}
      {calculationStep === 'normalized' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Formula documentation badge */}
          <div className="bg-indigo-900 text-indigo-50 border border-indigo-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-bold font-sans text-sm tracking-tight flex items-center gap-1.5 text-white">
                <Info className="w-4.5 h-4.5" />
                Matematika Normalisasi Matriks (R)
              </h4>
              <p className="text-xs text-indigo-200/90 leading-relaxed max-w-2xl">
                Setiap nilai mentah diubah ke desimal bernilai (0 s/d 1) untuk menstandarkan unit kriteria. Benefit menggunakan pembagi nilai maksimal. Cost menggunakan pembilang nilai terkecil agar parameter biaya/negatif tetap bernilai adil.
              </p>
            </div>
            <div className="bg-indigo-950/80 p-3 rounded-xl border border-indigo-800 font-mono text-[10px] space-y-1 text-indigo-200 shrink-0 select-all">
              <p>Benefit: R_ij = X_ij / max(X_j)</p>
              <p>Cost: R_ij = min(X_j) / X_ij</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h4 className="font-sans font-bold text-slate-900 text-sm">Hasil Matriks Yang Dinormalisasi (R)</h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">Nilai desimal skala 0 s/d 1</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 py-1.5 px-3 rounded-lg">
                Normalized State
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-6">ID</th>
                    <th className="py-3 px-6">Nama Peserta</th>
                    {kriteria.map(k => (
                      <th key={k.id} className="py-3 px-6 text-center font-bold">
                        {k.id} <span className="text-[9px] font-normal block lowercase">({k.jenis})</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {results.map((res) => (
                    <tr key={res.peserta.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-6 font-mono font-bold text-indigo-600">{res.peserta.id}</td>
                      <td className="py-3 px-6">
                        <p className="font-bold text-slate-900">{res.peserta.nama}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{res.peserta.instansi}</p>
                      </td>
                      {kriteria.map(k => {
                        const norm = res.skorNormalisasi[k.id] || 0;
                        return (
                          <td key={k.id} className="py-3 px-6 text-center font-mono font-bold text-indigo-600 bg-indigo-50/5">
                            {norm.toFixed(4)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PREFERENCES & RANKINGS FINAL RESULTS */}
      {calculationStep === 'pref' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 mb-6 gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase">SISTEM INTEGRASI SAW</span>
                <h4 className="font-bold text-slate-900 text-base font-sans mt-0.5">Rekomendasi Kelulusan & Kelayakan</h4>
                <p className="text-xs text-slate-500 mt-1">Status kelulusan otomatis ditentukan peringkat SAW dengan batasan kuota.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Quota Selector Field */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-500 font-mono uppercase">Kuota Lolos:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quotaInput}
                    onChange={(e) => handleQuotaInputChange(e.target.value)}
                    onBlur={handleQuotaBlur}
                    disabled={!isAdmin}
                    className="w-12 text-center bg-white border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg py-1 px-1 text-xs font-black font-mono text-slate-800 outline-none"
                  />
                </div>

                <div className="h-9 flex items-center gap-1 bg-slate-100 p-1 rounded-xl font-mono text-xs">
                  <span className="px-2.5 text-slate-500 font-bold">Status:</span>
                  <span className="bg-white text-indigo-700 px-2 py-1.5 rounded-lg border border-slate-200/80 font-bold">
                    Saran Terurut SAW (V)
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {results.map((res, index) => {
                const isWinner = res.peserta.status_keputusan === 'lolos';
                const isCancelled = res.peserta.status_keputusan === 'tidak_lolos';
                const percentProgress = Math.round(res.nilaiPreferensi * 100);

                // Highlight color depending on ranks
                const isRank1 = index === 0;
                const isRank2 = index === 1;

                return (
                  <div 
                    key={res.peserta.id} 
                    className={`p-5 rounded-2xl border transition-all ${
                      isWinner 
                        ? 'bg-emerald-50/40 border-emerald-300 shadow-sm' 
                        : isCancelled
                          ? 'bg-rose-50/10 border-rose-200/60 opacity-80'
                          : isRank1 
                            ? 'bg-indigo-50/20 border-indigo-150 hover:border-indigo-250' 
                            : 'bg-slate-50/40 border-slate-200 hover:border-slate-350'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      
                      {/* Name, index badge, and biography */}
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 font-sans shadow-inner bg-white border border-slate-250 text-slate-650">
                          {index + 1}
                        </div>

                        <div className="min-w-0 gap-1.5 flex flex-col">
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className={`font-bold text-slate-900 text-sm font-sans ${isCancelled ? 'line-through text-slate-400' : ''}`}>{res.peserta.nama}</h5>
                            
                            {isWinner && (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold text-[9px] font-mono px-2 py-0.5 border border-emerald-250 rounded-md">
                                <CheckCircle className="w-3 h-3 text-emerald-700" />
                                Lolos
                              </span>
                            )}

                            {isCancelled && (
                              <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-bold text-[9px] font-mono px-2 py-0.5 border border-rose-200 rounded-md">
                                <ShieldAlert className="w-3 h-3 text-rose-600" />
                                Dibatalkan Manual
                              </span>
                            )}

                            {!isWinner && !isCancelled && (
                              <span className="inline-flex items-center gap-1 bg-slate-150 text-slate-600 font-bold text-[9px] font-mono px-2 py-0.5 border border-slate-250 rounded-md">
                                Tidak Lolos
                              </span>
                            )}


                          </div>
                          
                          <p className={`text-[10px] font-bold font-mono text-slate-500 uppercase ${isCancelled ? 'text-slate-400' : ''}`}>
                            No Induk: {res.peserta.nisn_nip} &bull; {res.peserta.instansi}
                          </p>

                          {res.peserta.deskripsi && (
                            <p className="text-[11px] text-slate-500 max-w-xl truncate">
                              "{res.peserta.deskripsi}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Visual preference score bar and decide buttons */}
                      <div className="w-full md:w-64 flex flex-col gap-2 shrink-0 md:text-right">
                        <div className="flex items-center justify-between text-xs font-mono font-bold">
                          <span className="text-slate-400 font-sans">Preferensi (V):</span>
                          <span className="text-indigo-650 font-mono">{res.nilaiPreferensi.toFixed(4)}</span>
                        </div>

                        {/* Visual graph bar */}
                        <div className="w-full bg-slate-200/85 h-2.5 rounded-full overflow-hidden self-center relative border border-slate-100">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isWinner 
                                ? 'bg-emerald-500' 
                                : isCancelled
                                  ? 'bg-rose-300/60'
                                  : isRank1 
                                    ? 'bg-indigo-650' 
                                    : 'bg-indigo-400'
                            }`} 
                            style={{ width: `${percentProgress}%` }} 
                          />
                        </div>

                        {/* Admin decide winner action toggle */}
                        {isAdmin && (
                          <div className="flex justify-end gap-1 px-1 mt-1 shrink-0 h-8 self-end">
                            {isWinner && (
                              <button
                                id={`proses-decide-cancel-${res.peserta.id}`}
                                onClick={() => handleDecision(res.peserta.id, 'tidak_lolos')}
                                disabled={processing}
                                className="bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 font-sans font-bold text-[10px] px-3.5 py-1 rounded-lg tracking-wide uppercase transition-all cursor-pointer hover:shadow-xs"
                              >
                                Batalkan Pilihan
                              </button>
                            )}
                            
                            {isCancelled && (
                              <button
                                id={`proses-decide-restore-${res.peserta.id}`}
                                onClick={() => handleDecision(res.peserta.id, null)}
                                disabled={processing}
                                className="bg-indigo-50 border border-indigo-150 text-indigo-700 hover:bg-indigo-100 font-sans font-bold text-[10px] px-3.5 py-1 rounded-lg tracking-wide uppercase transition-all cursor-pointer hover:shadow-xs"
                              >
                                Masukkan Kembali
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
              {results.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-12">Belum ada perhitungan. Harap isi data terlebih dahulu.</p>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
